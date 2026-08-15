import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  evaluateTextualAnswer,
  roundToNearestHalfIELTS,
  type AnswerMutation,
  type HighlightAnnotation,
} from '@ielts/shared-types';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class ExamSessionService {
  private readonly logger = new Logger(ExamSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSession(sessionId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Exam session ${sessionId} not found`);
    }

    // Initialize or fetch timer from Redis
    let timeRemaining = await this.redis.getTimer(sessionId);
    if (timeRemaining === null) {
      timeRemaining = session.server_time_remaining;
      await this.redis.setTimer(sessionId, timeRemaining);
    }

    // Fetch the active TestPart and its questions
    const currentPart = await this.prisma.testPart.findUnique({
      where: { id: session.current_part_id },
      include: {
        test: { select: { id: true, title: true, module: true } },
        question_groups: {
          orderBy: { start_question_number: 'asc' },
        },
        questions: {
          orderBy: { question_number: 'asc' },
        },
      },
    });

    if (!currentPart) {
      throw new NotFoundException(`Part ${session.current_part_id} not found`);
    }

    // Fetch all parts in this test for navigation metadata
    const allParts = await this.prisma.testPart.findMany({
      where: { test_id: currentPart.test_id },
      orderBy: { order_index: 'asc' },
      select: {
        id: true,
        part_number: true,
        title: true,
        module: true,
        order_index: true,
      },
    });

    // Format answers as key-value map for the client
    const answersMap: Record<string, { value: any; version: number }> = {};
    for (const ans of session.answers) {
      answersMap[ans.question_id] = {
        value: ans.answer_value,
        version: ans.answer_version,
      };
    }

    return {
      session: {
        id: session.id,
        user: session.user,
        session_type: session.session_type,
        status: session.status,
        current_module: session.current_module,
        current_part_id: session.current_part_id,
        server_time_remaining: timeRemaining,
        total_duration_seconds: session.total_duration_seconds,
        audio_elapsed_seconds: session.audio_elapsed_seconds,
        result_visibility: session.result_visibility,
        highlights: typeof session.highlights === 'string' ? JSON.parse(session.highlights) : session.highlights || [],
      },
      test: currentPart.test,
      current_part: {
        id: currentPart.id,
        part_number: currentPart.part_number,
        title: currentPart.title,
        module: currentPart.module,
        passage_text: currentPart.passage_text,
        audio_url: currentPart.audio_url,
        question_groups: currentPart.question_groups,
        questions: currentPart.questions.map((q) => ({
          id: q.id,
          question_group_id: q.question_group_id,
          question_number: q.question_number,
          question_type: q.question_type,
          payload: q.payload,
          points: q.points,
        })),
      },
      all_parts: allParts,
      answers: answersMap,
    };
  }

  async autosaveBatch(sessionId: string, answers: AnswerMutation[]) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not active');
    }

    const persistedVersions: Record<string, number> = {};

    for (const ans of answers) {
      const existing = await this.prisma.answer.findUnique({
        where: {
          session_id_question_id: {
            session_id: sessionId,
            question_id: ans.question_id,
          },
        },
      });

      // Stale write protection: only accept newer versions
      if (!existing || ans.answer_version >= existing.answer_version) {
        await this.prisma.answer.upsert({
          where: {
            session_id_question_id: {
              session_id: sessionId,
              question_id: ans.question_id,
            },
          },
          create: {
            session_id: sessionId,
            question_id: ans.question_id,
            answer_value: ans.answer_value as any,
            answer_version: ans.answer_version,
            autosaved_at: new Date(),
          },
          update: {
            answer_value: ans.answer_value as any,
            answer_version: ans.answer_version,
            autosaved_at: new Date(),
          },
        });
        persistedVersions[ans.question_id] = ans.answer_version;
      } else {
        persistedVersions[ans.question_id] = existing.answer_version;
      }
    }

    const timeRemaining = (await this.redis.getTimer(sessionId)) ?? session.server_time_remaining;

    return {
      success: true,
      persisted_versions: persistedVersions,
      server_time_remaining: timeRemaining,
    };
  }

  async saveHighlights(sessionId: string, highlights: HighlightAnnotation[]) {
    await this.prisma.examSession.update({
      where: { id: sessionId },
      data: {
        highlights: JSON.stringify(highlights),
      },
    });

    return { success: true };
  }

  async submitFinal(sessionId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    let correctCount = 0;
    let totalPoints = 0;

    // Automatic grading for deterministic questions
    for (const ans of session.answers) {
      const q = ans.question;
      totalPoints += q.points;
      const payload = q.payload as any;
      let isCorrect = false;

      if (payload.type === 'true_false_not_given' || payload.type === 'yes_no_not_given') {
        isCorrect = String(ans.answer_value).toUpperCase() === String(payload.correct_answer).toUpperCase();
      } else if (payload.type === 'multiple_choice_single' || payload.type === 'matching_information') {
        isCorrect = ans.answer_value === payload.correct_option_id;
      } else if (payload.type === 'matching_headings') {
        isCorrect = ans.answer_value === payload.correct_heading_id;
      } else if (payload.type === 'sentence_completion' || payload.type === 'summary_completion' || payload.type === 'short_answer') {
        if (typeof ans.answer_value === 'string' && payload.accepted_answers) {
          const evalResult = evaluateTextualAnswer(ans.answer_value, payload.accepted_answers, payload.max_words);
          isCorrect = evalResult.is_correct;
        }
      }

      await this.prisma.answer.update({
        where: { id: ans.id },
        data: { is_correct: isCorrect },
      });

      if (isCorrect) {
        correctCount += q.points;
      }
    }

    // Estimate IELTS reading/listening band
    const rawRatio = totalPoints > 0 ? (correctCount / totalPoints) * 9 : 0;
    const bandScore = roundToNearestHalfIELTS(rawRatio);

    const updated = await this.prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.SUBMITTED,
        submitted_at: new Date(),
        server_time_remaining: 0,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: session.user_id,
        action: 'EXAM_SUBMITTED',
        entity: 'ExamSession',
        entity_id: sessionId,
        meta: {
          correct_count: correctCount,
          total_points: totalPoints,
          band_score: bandScore,
        },
      },
    });

    return {
      success: true,
      status: updated.status,
      correct_count: correctCount,
      total_points: totalPoints,
      estimated_band: bandScore,
    };
  }
}
