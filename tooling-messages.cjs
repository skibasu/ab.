/** Messages for Node.js tooling; kept outside folders moved by reset-project. */
const SCRIPT_LOG_MESSAGES = {
  development: {
    checking: '[dev] Checking TypeScript and ESLint…',
    checksPassed: '[dev] TypeScript and ESLint passed.',
    validationFailed:
      '[dev] Validation failed. Expo/Metro paused. Waiting for a saved fix; the server will restart automatically.',
    checkFailed: (name) => `[dev] ${name}:`,
    expoStartFailed: '[dev] Expo:',
    fileWatcherFailed: '[dev] File watcher:',
    processSignalFailed: '[dev] Failed to signal a child process:',
    validationCrashed: '[dev] Validation failed unexpectedly:',
  },
  reset: {
    directoryCreated: (directory) => `📁 /${directory} directory created.`,
    pathMoved: (source, destination) => `➡️ /${source} moved to /${destination}.`,
    pathDeleted: (target) => `❌ /${target} deleted.`,
    pathMissing: (target) => `➡️ /${target} does not exist, skipping.`,
    appDirectoryCreated: '\n📁 New /src/app directory created.',
    fileCreated: (file) => `📄 ${file} created.`,
    complete: '\n✅ Project reset complete. Next steps:',
    nextSteps: (exampleDirectory) =>
      `1. Run \`npx expo start\` to start a development server.\n2. Edit src/app/index.tsx to edit the main screen.\n3. Put all your application code in /src, only screens and layout files should be in /src/app.${
        exampleDirectory
          ? `\n4. Delete the /${exampleDirectory} directory when you're done referencing it.`
          : ''
      }`,
    failed: '❌ Error during script execution:',
    invalidInput: "❌ Invalid input. Please enter 'Y' or 'N'.",
    confirmation:
      'Do you want to move existing files to /example instead of deleting them? (Y/n): ',
  },
};

const BUILD_ERROR_MESSAGES = {
  nodeStreamsUnavailable: 'Node.js stream APIs are unavailable in this app.',
};

module.exports = { SCRIPT_LOG_MESSAGES, BUILD_ERROR_MESSAGES };
