# Native ZIP import on iPhone

This local Expo module implements native extraction during import, following BookPlayer's import approach. It uses ZIPFoundation 0.9.20 for Store/Deflate decoding; it does not play audio directly from a ZIP.

Expo autolinks this module from `modules/`. CocoaPods installs ZIPFoundation through `ios/BookZip.podspec`. Build a new iOS development client after adding or changing the module. Metro reloads and OTA JavaScript updates cannot install native code. An older client reports `import/native-build-required` when importing ZIPs; direct MP3 imports remain available.

The JavaScript preflight still checks archive paths, encryption, entry counts and declared sizes. Only the manifest crosses into Swift. Swift performs decoding, CRC verification and file writes on a background queue with bounded buffers. It checks actual output sizes for all entries, including discarded files. Audio files receive generated UUID names. An abort requests native cancellation; the caller awaits completion before deleting the workspace. Existing account guards and metadata grouping remain in place.

Limits come from `src/constants/book-import-config.ts` and are passed to native code. Configured limits apply to both extraction phases. Android/web keep the existing JavaScript backend.

Run `npm run test:zip` for preflight, session and native adapter checks. On macOS, run `swift test --package-path modules/book-zip` for the real extraction core tests. These compile the extraction core against the same pinned ZIPFoundation version without generating app native projects. The Expo bridge and performance on a real iPhone still require an iOS development build and device verification, especially for 300–600 MB archives.

## Repeated imports

Completed ZIP imports are remembered per account in SQLite using a native SHA-256 digest of the entire archive. A repeat selection skips extraction and tag parsing only while all recorded library tracks still exist with their recorded sizes and modification times. Failed or partial imports are not marked complete. Removing a book, resetting the library or changing a recorded audio file invalidates this shortcut. Additional parts can still be appended normally.

For ZIPs imported before this optimization, one further complete import is needed to populate the history. Repacked ZIPs have a different digest and follow the normal import path. MP3 duplicate comparisons also use native SHA-256, with each candidate hashed at most once per book comparison. System picker downloads and cache copying still take place before the app can inspect a selected file.

## Import previews and progress

`BookProgressBarLoader` takes a number from 0 to 100. `book-import-store.ts` holds transient, account-scoped progress and preview cards; it does not persist the import or put pending books in the library database. The Import button retains its existing disabled and loading conditions.

The staged native endpoint extracts and verifies the first visible MP3, waits for JavaScript to read its tags and prepare its embedded or Open Library cover, and then processes the remaining entries. Byte progress events are throttled to roughly ten per second and scoped by job ID. The JavaScript fallback follows the same preview-before-remainder ordering. Subsequent metadata discovers additional books in a multi-book archive; each receives its own preview. Original embedded artwork takes precedence when a later part provides it.

Overall progress combines preparation, extraction bytes, metadata counts, duplicate comparisons, copying counts and final database commits. UI animation smooths reported values; it does not advance a timer to invent completed work. Temporary cover files remain available until the library has refreshed and the pending cards are removed. Cancellation and account changes clear the previews and clean up temporary files. The new staged endpoint and the SVG loader require a rebuilt iOS development client.
