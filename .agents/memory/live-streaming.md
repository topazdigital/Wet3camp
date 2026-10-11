---
name: Live streaming system
description: Durable product constraints for the live video experience
---

Live broadcasts use the app's native camera preview and video player; do not reintroduce an embedded Jitsi flow. A broadcaster must explicitly grant camera/microphone access and start the stream. Live video is not saved as a recording. The relay is process-local, so an API restart ends active broadcasts and a multi-instance deployment would need shared media transport.

**Why:** Creators need clear control over when their camera is on, and viewers must not be promised archived video or uninterrupted service that the current relay cannot provide.

**How to apply:** Preserve the preview-before-broadcast consent step and clear live/connection status. If scaling or recording becomes a requirement, design that as a separate media-infrastructure change rather than assuming the current in-memory relay supports it.
