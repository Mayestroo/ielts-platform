# Lazy Just-In-Time Media Delivery and Presigned URL Lifecycle

Preventing unauthorized media exfiltration while minimizing API bandwidth requires strict access control over audio files and test images. We decided to store media in S3-compatible storage and generate short-lived presigned URLs (60–90 second TTL) strictly for the student's currently unlocked `Test Part`. Future locked parts yield no media URLs, and the frontend runtime seamlessly requests refreshed presigned URLs on expiration to maintain uninterrupted audio playback.
