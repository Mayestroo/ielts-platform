# Question Granularity and Shared Answer Pools

IELTS tasks frequently combine multiple numbered questions into a single instruction set with mutual letter options (e.g., "Questions 21–22: Choose TWO letters"). We decided to model each question number as an independent `Question` entity under a shared `QuestionGroup` with an `answer_pool_shared: boolean` flag. When enabled, the frontend runtime mutually disables already selected options across the group, preventing duplicate allocations while maintaining 1:1 parity with standard IELTS question numbering.
