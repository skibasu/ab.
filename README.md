# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Formatting, imports and strict checks

Use Node.js 22.22 or newer. Open this directory (`mobileApp/ab`) or the repository's parent workspace (`aB-ui-figma`) in VS Code/Cursor and install the recommended Prettier and ESLint extensions. Both workspace layouts have editor settings.

On save, the editor adds unambiguous missing imports, removes unused imports, applies ESLint fixes and formats the file. Auto-import suggestions are also enabled while typing. When several exports have the same name, select the intended one from the editor suggestions. These editor actions require the extensions and the built-in TypeScript language service; terminal commands cannot infer which component you intended to import.

Prettier puts JSX attributes on separate lines when there are multiple attributes. A tag with one short attribute can remain on one line. `npm run format` formats the project; `npm run lint:fix` removes unused imports from files edited outside the editor. Unused local variables, parameters and imports are errors, including names beginning with `_` in ESLint.

Start development through one of these commands:

```bash
npm start
npm run ios
npm run android
npm run web
```

Each command checks TypeScript and ESLint before starting Expo. Saved changes to JavaScript, TypeScript and JSON files trigger both checks again. An error (or an ESLint warning) pauses Expo/Metro while the supervisor keeps watching files. Save a fix and, once both checks pass, Expo restarts automatically with the same command-line arguments. Errors present at startup also leave the watcher active, so fixing them starts the server without another `npm start`. The checker never fixes files silently. Use Ctrl+C to exit the supervisor; standalone `npm run check` still exits with a nonzero code on errors.

Stopping Metro does not close an already running native application: the device may still display the last successfully loaded JavaScript bundle. Direct `npx expo start` bypasses this project's supervisor, so use the npm scripts above.

Run the complete verification before committing:

```bash
npm run check
```

Individual checks are `npm run typecheck`, `npm run lint` and `npm run format:check`. The combined check also verifies formatting; the development supervisor blocks on TypeScript and lint errors only.

`npm run test:dev` tests startup validation, automatic recovery after TypeScript/lint errors, valid edits and process cleanup. The tests use real compilers and a small Expo process fixture, without modifying application files.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- ESLint and Prettier are configured in this project using [Expo's ESLint and Prettier guidance](https://docs.expo.dev/guides/using-eslint/).
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
