import { PrismaClient, Role, Tier, ModuleType, TestFormat, TestStatus, SessionType, SessionStatus, ResultVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding IELTS platform database...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // Clean existing data
  await prisma.answer.deleteMany();
  await prisma.examSessionPart.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionGroup.deleteMany();
  await prisma.testPart.deleteMany();
  await prisma.test.deleteMany();
  await prisma.sessionDevice.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const student = await prisma.user.create({
    data: {
      id: 'student-user-1',
      email: 'student@ielts.local',
      full_name: 'Jasurbek Rahimberdiyev',
      password_hash: defaultPasswordHash,
      role: Role.STUDENT,
      tier: Tier.PREMIUM,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ielts.local' },
    update: { password_hash: defaultPasswordHash },
    create: {
      email: 'admin@ielts.local',
      password_hash: defaultPasswordHash,
      full_name: 'Supervisor Admin',
      role: Role.ADMIN,
      tier: Tier.PREMIUM,
    },
  });

  const grader = await prisma.user.upsert({
    where: { email: 'grader@ielts.local' },
    update: { password_hash: defaultPasswordHash },
    create: {
      email: 'grader@ielts.local',
      password_hash: defaultPasswordHash,
      full_name: 'Examiner Grader',
      role: Role.GRADER,
      tier: Tier.PREMIUM,
    },
  });

  console.log('Created users:', { student: student.email, admin: admin.email, grader: grader.email });

  // 2. Create Reading Test with 3 Passages & Authentic Questions
  const readingTest = await prisma.test.create({
    data: {
      id: 'test-reading-1',
      module: ModuleType.READING,
      title: 'Academic Reading Practice Test 1',
      tier: Tier.FREE,
      format: TestFormat.FULL,
      status: TestStatus.PUBLISHED,
      version: 1,
    },
  });

  // Part 1: The Development of the Bicycle
  const readingPart1 = await prisma.testPart.create({
    data: {
      id: 'part-reading-1',
      test_id: readingTest.id,
      module: ModuleType.READING,
      part_number: 1,
      title: 'Passage 1 — The Development of the Modern Bicycle',
      order_index: 1,
      passage_text: `The early ancestor of the modern bicycle was the celerifere, invented around 1790 by Comte Mede de Sivrac of France. It consisted of two wheels held together by a rigid wooden frame. The rider sat astride the machine and propelled it by pushing their feet against the ground in a walking or running motion. However, steering was impossible because the front wheel could not be turned.

In 1817, Baron Karl von Drais of Germany introduced the Draisine (or "running machine"). This revolutionary vehicle incorporated a steerable front wheel, allowing riders to maintain balance and change directions. Constructed largely of wood with iron-banded wheels, the Draisine gained brief popularity across Europe.

During the 1860s, Pierre Michaux and his son Ernest attached pedals and cranks directly to the front axle, producing the "velocipede" (commonly known as the "boneshaker" due to its rough ride over cobblestone roads).

To achieve greater speeds without gears, inventors in the 1870s enlarged the front wheel, leading to the iconic "Penny Farthing" (or High-Wheeler). While capable of high speeds, the high center of gravity made sudden stops hazardous, often throwing riders forward over the handlebars.

Finally, in 1885, John Kemp Starley introduced the "Rover Safety Bicycle" in England. Featuring equal-sized wheels, a steerable front fork, and a chain drive powering the rear wheel, it established the foundational geometry of the modern bicycle. John Boyd Dunlop's invention of the pneumatic rubber tire in 1888 dramatically reduced road vibration, making cycling a comfortable and ubiquitous mode of transport worldwide.`,
    },
  });

  // Group 1: True / False / Not Given (Questions 1-4)
  const qGroup1 = await prisma.questionGroup.create({
    data: {
      id: 'qgroup-1',
      test_part_id: readingPart1.id,
      instruction_text: 'Do the following statements agree with the information given in Reading Passage 1? In boxes 1–4 on your answer sheet, choose TRUE, FALSE, or NOT GIVEN.',
      range_label: 'Questions 1–4',
      question_type: 'true_false_not_given',
      start_question_number: 1,
      end_question_number: 4,
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-1',
      test_part_id: readingPart1.id,
      question_group_id: qGroup1.id,
      question_number: 1,
      question_type: 'true_false_not_given',
      payload: {
        type: 'true_false_not_given',
        statement: 'The celerifere allowed the rider to turn the front wheel while traveling.',
        correct_answer: 'FALSE',
      },
      points: 1,
      explanation_text: 'The text explicitly states: "However, steering was impossible because the front wheel could not be turned."',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-2',
      test_part_id: readingPart1.id,
      question_group_id: qGroup1.id,
      question_number: 2,
      question_type: 'true_false_not_given',
      payload: {
        type: 'true_false_not_given',
        statement: 'Baron Karl von Drais received government funding for his running machine.',
        correct_answer: 'NOT GIVEN',
      },
      points: 1,
      explanation_text: 'The passage mentions Baron Karl von Drais developed the running machine, but does not state whether he received government funding.',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-3',
      test_part_id: readingPart1.id,
      question_group_id: qGroup1.id,
      question_number: 3,
      question_type: 'true_false_not_given',
      payload: {
        type: 'true_false_not_given',
        statement: 'The Penny Farthing bicycle posed safety risks during rapid braking.',
        correct_answer: 'TRUE',
      },
      points: 1,
      explanation_text: 'The text notes: "sudden stops hazardous, often throwing riders forward over the handlebars."',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-4',
      test_part_id: readingPart1.id,
      question_group_id: qGroup1.id,
      question_number: 4,
      question_type: 'true_false_not_given',
      payload: {
        type: 'true_false_not_given',
        statement: 'John Boyd Dunlop invented the chain-drive transmission system.',
        correct_answer: 'FALSE',
      },
      points: 1,
      explanation_text: 'John Kemp Starley introduced the chain drive, whereas John Boyd Dunlop invented pneumatic rubber tires.',
    },
  });

  // Group 2: Sentence Gap Fill (Questions 5-7)
  const qGroup2 = await prisma.questionGroup.create({
    data: {
      id: 'qgroup-2',
      test_part_id: readingPart1.id,
      instruction_text: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
      range_label: 'Questions 5–7',
      question_type: 'sentence_completion',
      start_question_number: 5,
      end_question_number: 7,
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-5',
      test_part_id: readingPart1.id,
      question_group_id: qGroup2.id,
      question_number: 5,
      question_type: 'sentence_completion',
      payload: {
        type: 'sentence_completion',
        sentence_prefix: 'The velocipede earned the nickname',
        sentence_suffix: 'because of the unpleasant vibration caused by cobblestone streets.',
        accepted_answers: ['boneshaker', 'the boneshaker'],
        max_words: 2,
      },
      points: 1,
      explanation_text: 'The text states: "...producing the velocipede (commonly known as the boneshaker due to its rough ride...)"',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-6',
      test_part_id: readingPart1.id,
      question_group_id: qGroup2.id,
      question_number: 6,
      question_type: 'sentence_completion',
      payload: {
        type: 'sentence_completion',
        sentence_prefix: 'In 1885, John Kemp Starley unveiled the',
        sentence_suffix: 'featuring wheels of identical diameter.',
        accepted_answers: ['rover safety bicycle', 'safety bicycle'],
        max_words: 3,
      },
      points: 1,
      explanation_text: 'Starley introduced the "Rover Safety Bicycle" with equal-sized wheels.',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-7',
      test_part_id: readingPart1.id,
      question_group_id: qGroup2.id,
      question_number: 7,
      question_type: 'sentence_completion',
      payload: {
        type: 'sentence_completion',
        sentence_prefix: 'Road vibrations were substantially dampened following the development of the',
        sentence_suffix: 'by John Boyd Dunlop in 1888.',
        accepted_answers: ['pneumatic rubber tire', 'pneumatic tire', 'rubber tire'],
        max_words: 3,
      },
      points: 1,
      explanation_text: 'Pneumatic rubber tires invented in 1888 absorbed vibrations.',
    },
  });

  // Group 3: Multiple Choice (Questions 8-10)
  const qGroup3 = await prisma.questionGroup.create({
    data: {
      id: 'qgroup-3',
      test_part_id: readingPart1.id,
      instruction_text: 'Choose the correct letter, A, B, C, or D.',
      range_label: 'Questions 8–10',
      question_type: 'multiple_choice_single',
      start_question_number: 8,
      end_question_number: 10,
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-8',
      test_part_id: readingPart1.id,
      question_group_id: qGroup3.id,
      question_number: 8,
      question_type: 'multiple_choice_single',
      payload: {
        type: 'multiple_choice_single',
        prompt: 'What was the principal engineering addition introduced in the 1860s by the Michaux family?',
        options: [
          { id: 'opt-a', label: 'A', text: 'Pneumatic rubber tires' },
          { id: 'opt-b', label: 'B', text: 'Pedals and cranks attached to the front axle' },
          { id: 'opt-c', label: 'C', text: 'Rear-wheel chain drive transmission' },
          { id: 'opt-d', label: 'D', text: 'Enlarged oversized front wheels' },
        ],
        correct_option_id: 'opt-b',
      },
      points: 1,
      explanation_text: 'Michaux attached pedals and cranks directly to the front axle.',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-9',
      test_part_id: readingPart1.id,
      question_group_id: qGroup3.id,
      question_number: 9,
      question_type: 'multiple_choice_single',
      payload: {
        type: 'multiple_choice_single',
        prompt: 'Why was the front wheel of the Penny Farthing made exceptionally large?',
        options: [
          { id: 'opt-a', label: 'A', text: 'To improve stability on wet roads' },
          { id: 'opt-b', label: 'B', text: 'To achieve higher speeds in the absence of gears' },
          { id: 'opt-c', label: 'C', text: 'To reduce manufacturing costs' },
          { id: 'opt-d', label: 'D', text: 'To provide space for luggage transport' },
        ],
        correct_option_id: 'opt-b',
      },
      points: 1,
      explanation_text: 'The text explains: "To achieve greater speeds without gears, inventors enlarged the front wheel..."',
    },
  });

  await prisma.question.create({
    data: {
      id: 'q-10',
      test_part_id: readingPart1.id,
      question_group_id: qGroup3.id,
      question_number: 10,
      question_type: 'multiple_choice_single',
      payload: {
        type: 'multiple_choice_single',
        prompt: 'Which feature distinguishes the modern bicycle geometry introduced by Starley?',
        options: [
          { id: 'opt-a', label: 'A', text: 'Equal-sized wheels and rear chain drive' },
          { id: 'opt-b', label: 'B', text: 'Wooden frame without steering capability' },
          { id: 'opt-c', label: 'C', text: 'Oversized front wheel with direct pedal drive' },
          { id: 'opt-d', label: 'D', text: 'Iron-banded solid wheels' },
        ],
        correct_option_id: 'opt-a',
      },
      points: 1,
      explanation_text: 'Starley introduced equal-sized wheels and a chain drive powering the rear wheel.',
    },
  });

  // 3. Create Listening & Writing Test Parts
  const listeningPart1 = await prisma.testPart.create({
    data: {
      id: 'part-listening-1',
      test_id: readingTest.id,
      module: ModuleType.LISTENING,
      part_number: 1,
      title: 'Listening Part 1 — Public Library Registration',
      order_index: 1,
      audio_url: 'https://cdn.example.com/ielts/audio/listening_test1_part1.mp3',
    },
  });

  const writingPart1 = await prisma.testPart.create({
    data: {
      id: 'part-writing-1',
      test_id: readingTest.id,
      module: ModuleType.WRITING,
      part_number: 1,
      title: 'Writing Task 1 — Renewable Energy Generation',
      order_index: 1,
      passage_text: 'The chart below shows the proportion of electricity generated by renewable energy sources in four European countries between 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    },
  });

  // 4. Create an Active ExamSession for instant manual & browser verification
  const session = await prisma.examSession.create({
    data: {
      id: 'mock-session-001',
      user_id: student.id,
      session_type: SessionType.SELF_PRACTICE,
      status: SessionStatus.IN_PROGRESS,
      current_module: ModuleType.READING,
      current_part_id: readingPart1.id,
      server_time_remaining: 3600, // 60 minutes
      total_duration_seconds: 3600,
      audio_elapsed_seconds: 0,
      result_visibility: ResultVisibility.IMMEDIATE,
      highlights: JSON.stringify([
        {
          id: 'hl-1',
          part_id: readingPart1.id,
          start_offset: 24,
          end_offset: 76,
          color: 'yellow',
          text: 'celerifere, invented around 1790 by Comte Mede de Sivrac',
        },
      ]),
    },
  });

  // Pre-seed an answered question to demonstrate the green indicator in PartNavigator
  await prisma.answer.create({
    data: {
      session_id: session.id,
      question_id: 'q-1',
      answer_value: 'FALSE',
      answer_version: 1,
      is_correct: true,
    },
  });

  console.log('Seeded active exam session:', session.id);
  console.log('Seeding complete! 10 IELTS questions across True/False/Not Given, Gap-fill, and Multiple Choice created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
