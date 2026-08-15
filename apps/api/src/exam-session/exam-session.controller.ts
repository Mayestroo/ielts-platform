import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service.js';
import type { AnswerMutation, HighlightAnnotation } from '@ielts/shared-types';

@Controller('api/exam-sessions')
export class ExamSessionController {
  constructor(private readonly sessionService: ExamSessionService) {}

  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }

  @Post(':id/autosave')
  @HttpCode(HttpStatus.OK)
  async autosaveBatch(
    @Param('id') id: string,
    @Body() body: { answers: AnswerMutation[] }
  ) {
    return this.sessionService.autosaveBatch(id, body.answers);
  }

  @Post(':id/highlights')
  @HttpCode(HttpStatus.OK)
  async saveHighlights(
    @Param('id') id: string,
    @Body() body: { highlights: HighlightAnnotation[] }
  ) {
    return this.sessionService.saveHighlights(id, body.highlights);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitFinal(@Param('id') id: string) {
    return this.sessionService.submitFinal(id);
  }
}
