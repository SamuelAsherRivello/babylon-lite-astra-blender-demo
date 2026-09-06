# Browser verification

- Run responsive and device emulation checks in dedicated test browser sessions. Do not resize or emulate devices in the user's browsing tabs.
- Capture the original viewport before a test. Restore it in `finally`, including after failed assertions. If the session started without an override, clear device metrics instead of assigning a guessed desktop size.
- Clear held keys, touch pointers, touch emulation and forced focus when the test ends. Verify the original viewport was restored.
- Check the actual installed Chrome and Microsoft Edge browsers for layout fixes. Assert both viewport fit and horizontal centering; a narrow emulated page in a wide window is not evidence that the app's CSS is broken.
- Before changing camera scale or CSS for a browser mismatch, inspect the affected tab's viewport/emulation/zoom state. Preserve an explicitly approved browser scale.
- Record which browser surface was tested and distinguish a reproduced application bug from an automation state leak. Do not claim the original screenshot's cause without evidence.
