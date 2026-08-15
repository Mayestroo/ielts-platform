# Unified IELTS Band Rounding Formula

IELTS scoring specifies rounding to the nearest half-band (0.5), with fractional remainders of exactly .25 and .75 rounded upwards to the next half or whole band. We decided to implement this logic as a single mathematical helper (`roundToNearestHalfIELTS`) housed in `packages/shared-types` (or `shared-utils`). This centralized function guarantees identical, deterministic band calculations across all exam result summaries, administrative reports, and downloadable certificates.
