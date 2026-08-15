# Zod-Driven Runtime Validation for Prisma JSONB Schemas

Prisma's native `Json` scalar does not enforce payload structures at runtime, risking data corruption in polymorphic entities like `Question.payload` and `Answer.answer_value`. We decided to define all question types, interaction payloads, and answer values as Zod schemas in `packages/shared-types`, inferring TypeScript types directly via `z.infer<>`. All JSONB reads and writes in both the NestJS API and Next.js frontend are strictly validated through these Zod schemas to guarantee end-to-end type safety.
