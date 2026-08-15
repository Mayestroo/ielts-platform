# Listening Audio Playback and Refresh Synchronization

Authentic IELTS Computer-Delivered Testing requires unalterable, single-pass audio playback. We decided to enforce strict single-play audio without scrubbing or replay controls during `Offline Mock` sessions, providing only volume adjustment. On page reload, the client synchronizes playback to the server's elapsed audio timestamp; any playback time elapsed during the reload is forfeited to prevent artificial replay advantages. Full playback controls remain available in `Self Practice`.
