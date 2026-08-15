# Turborepo Monorepo Structure

The platform requires synchronized data structures for question payloads, answer types, and exam state across the frontend and backend. We decided to structure the repository as a Turborepo monorepo (`apps/web`, `apps/api`, `packages/shared-types`). This enforces compile-time type safety for `Question.payload` discriminated unions and DTOs across both services simultaneously.
