import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { watch } from 'chokidar';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const checks = [
  { name: 'TypeScript', file: require.resolve('typescript/bin/tsc'), args: ['--noEmit'] },
  {
    name: 'ESLint',
    file: path.join(path.dirname(require.resolve('eslint/package.json')), 'bin/eslint.js'),
    args: ['.', '--max-warnings', '0'],
  },
];
const ignoredDirectories = new Set([
  'node_modules',
  '.git',
  '.expo',
  '.claude',
  'assets',
  'ios',
  'android',
  'dist',
  'web-build',
  'coverage',
  'example',
]);
const children = new Set();
let expo;
let timer;
let checking = false;
let dirty = false;
let stopping = false;

// Watch before the first check so edits made during startup are also validated.
const watcher = watch(root, {
  ignoreInitial: true,
  ignored: (file) =>
    path
      .relative(root, file)
      .split(path.sep)
      .some((part) => ignoredDirectories.has(part)),
  awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
});

function run(file, args, interactive = false) {
  const child = spawn(process.execPath, [file, ...args], {
    cwd: root,
    stdio: interactive ? 'inherit' : ['ignore', 'inherit', 'inherit'],
    // A separate process group lets us stop Metro workers as well as Expo.
    detached: process.platform !== 'win32',
  });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}

function signalChild(child, signal) {
  if (!child.pid) return;
  try {
    if (process.platform === 'win32') {
      if (signal === 'SIGKILL') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill(signal);
      }
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error.code !== 'ESRCH') console.error(error);
  }
}

async function stop(code) {
  if (stopping) return;
  stopping = true;
  clearTimeout(timer);
  // Remember every group even if its parent exits before the fallback fires.
  const running = [...children];
  for (const child of running) signalChild(child, 'SIGTERM');
  const forceExit = setTimeout(() => {
    for (const child of running) signalChild(child, 'SIGKILL');
    process.exit(code);
  }, 1500);
  await watcher.close();
  await Promise.all(
    running.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) resolve();
          else child.once('exit', resolve);
        }),
    ),
  );
  clearTimeout(forceExit);
  // Clean up any descendants left after their parent has exited.
  for (const child of running) signalChild(child, 'SIGKILL');
  process.exit(code);
}

function runCheck({ name, file, args }) {
  return new Promise((resolve) => {
    const child = run(file, args);
    child.once('error', (error) => {
      console.error(`[dev] ${name}: ${error.message}`);
      resolve(false);
    });
    child.once('exit', (code) => resolve(code === 0));
  });
}

async function pauseExpo() {
  const child = expo;
  if (!child) return;
  // Its exit is intentional: keep the supervisor and watcher alive.
  expo = undefined;
  const exited = new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) resolve();
    else child.once('exit', resolve);
  });
  signalChild(child, 'SIGTERM');
  const forceKill = setTimeout(() => signalChild(child, 'SIGKILL'), 1500);
  try {
    // Wait for the old server to release its port before starting another one.
    await exited;
  } finally {
    clearTimeout(forceKill);
    signalChild(child, 'SIGKILL');
  }
}

async function validate() {
  if (stopping || checking) return;
  checking = true;
  dirty = false;
  try {
    console.log('[dev] Checking TypeScript and ESLint…');
    const results = await Promise.all(checks.map(runCheck));
    // If files changed during the check, validate their latest saved contents.
    if (stopping || dirty) return;
    if (results.some((passed) => !passed)) {
      await pauseExpo();
      console.error(
        '[dev] Validation failed. Expo/Metro paused. Waiting for a saved fix; the server will restart automatically.',
      );
      return;
    }
    console.log('[dev] TypeScript and ESLint passed.');
    if (!expo) {
      const child = run(require.resolve('expo/bin/cli'), ['start', ...process.argv.slice(2)], true);
      expo = child;
      child.once('error', async (error) => {
        console.error(`[dev] Expo: ${error.message}`);
        await stop(1);
      });
      child.once('exit', async (code, signal) => {
        if (!stopping && expo === child) await stop(code ?? (signal ? 1 : 0));
      });
    }
  } finally {
    checking = false;
    // Includes edits saved while the previous Expo process was stopping.
    if (dirty && !stopping) scheduleCheck();
  }
}

function scheduleCheck() {
  if (stopping) return;
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    validate().catch(async (error) => {
      console.error(error);
      await stop(1);
    });
  }, 200);
}

watcher.on('all', (event, file) => {
  if (
    event !== 'addDir' &&
    event !== 'unlinkDir' &&
    /\.(?:[cm]?[jt]sx?|json)$/.test(file) &&
    path.basename(file) !== 'package-lock.json'
  ) {
    scheduleCheck();
  }
});
watcher.once('ready', scheduleCheck);
watcher.on('error', async (error) => {
  console.error(`[dev] File watcher: ${error.message}`);
  await stop(1);
});
process.once('SIGINT', () => void stop(130));
process.once('SIGTERM', () => void stop(143));
