import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('..', import.meta.url));

async function fixture(t, initialSource = "export const message: string = 'ready';\n") {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ab-dev-check-'));
  await mkdir(path.join(root, 'src'));
  await mkdir(path.join(root, 'scripts'));
  await mkdir(path.join(root, 'node_modules'), { recursive: true });
  for (const name of [
    'chokidar',
    'typescript',
    'eslint',
    'eslint-plugin-unused-imports',
    '@typescript-eslint/parser',
  ]) {
    const target = path.join(root, 'node_modules', name);
    await mkdir(path.dirname(target), { recursive: true });
    await symlink(path.join(project, 'node_modules', name), target, 'junction');
  }
  await copyFile(new URL('dev.mjs', import.meta.url), path.join(root, 'scripts/dev.mjs'));
  await writeFile(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        skipLibCheck: true,
        types: [],
      },
      include: ['src/**/*.ts'],
    }),
  );
  await writeFile(
    path.join(root, 'eslint.config.cjs'),
    `module.exports = [
      { ignores: ['scripts/**', 'eslint.config.cjs'] },
      {
        files: ['src/**/*.{js,ts}'],
        languageOptions: { parser: require('@typescript-eslint/parser') },
        plugins: { 'unused-imports': require('eslint-plugin-unused-imports') },
        rules: {
          'unused-imports/no-unused-imports': 'error',
          'unused-imports/no-unused-vars': ['error', { args: 'all', vars: 'all' }]
        }
      }
    ];`,
  );
  await writeFile(path.join(root, 'src/index.ts'), initialSource);

  // Real TypeScript, ESLint and filesystem watching; only Expo is a fixture.
  const expo = path.join(root, 'node_modules/expo');
  await mkdir(path.join(expo, 'bin'), { recursive: true });
  await writeFile(path.join(expo, 'package.json'), '{"name":"expo","version":"0.0.0"}');
  await writeFile(
    path.join(expo, 'bin/cli'),
    `const fs = require('node:fs');
     fs.writeFileSync('expo-started.log', 'started');
     console.log('EXPO_FIXTURE_READY');
     process.on('SIGTERM', () => {
       fs.writeFileSync('expo-stopped.log', 'stopped');
       process.exit(0);
     });
     setInterval(() => {}, 1000);`,
  );

  const child = spawn(process.execPath, ['scripts/dev.mjs'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => (output += data));
  child.stderr.on('data', (data) => (output += data));
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await exited;
    }
    await rm(root, { recursive: true, force: true });
  });

  async function waitFor(predicate, description) {
    for (let attempt = 0; attempt < 300; attempt++) {
      if (predicate(output)) return;
      assert.equal(child.exitCode, null, output);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.fail(`Development supervisor did not ${description}:\n${output}`);
  }

  const ready = (starts = 1) =>
    waitFor((text) => text.split('EXPO_FIXTURE_READY').length - 1 >= starts, 'start Expo');
  const paused = (pauses = 1) =>
    waitFor(
      (text) => text.split('Expo/Metro paused.').length - 1 >= pauses,
      'pause Expo and wait for a fix',
    );

  return { root, child, exited, ready, paused, waitFor, output: () => output };
}

test('an initial TypeScript error blocks Expo until a saved fix', { timeout: 20000 }, async (t) => {
  const f = await fixture(t, 'export const message: string = 123;\n');
  await f.paused();
  assert.equal(f.child.exitCode, null);
  assert.match(f.output(), /TS2322/);
  assert.doesNotMatch(f.output(), /EXPO_FIXTURE_READY/);
  await writeFile(path.join(f.root, 'src/index.ts'), "export const message: string = 'fixed';\n");
  await f.ready();
});

test(
  'using a previously unused variable automatically starts Expo',
  { timeout: 20000 },
  async (t) => {
    const f = await fixture(t, 'let x = 0;\nexport {};\n');
    await f.paused();
    assert.equal(f.child.exitCode, null);
    assert.match(f.output(), /error.*unused-imports\/no-unused-vars/);
    assert.doesNotMatch(f.output(), /EXPO_FIXTURE_READY/);
    await writeFile(path.join(f.root, 'src/index.ts'), 'let x = 0;\nexport const value = x;\n');
    await f.ready();
  },
);

test(
  'saved TypeScript errors pause Expo and fixes restart it repeatedly',
  { timeout: 20000 },
  async (t) => {
    const f = await fixture(t);
    await f.ready();
    for (let cycle = 1; cycle <= 2; cycle++) {
      await writeFile(path.join(f.root, 'src/index.ts'), 'export const message: string = 123;\n');
      await f.paused(cycle);
      assert.equal(f.child.exitCode, null);
      assert.match(f.output(), /TS2322/);
      assert.equal(await readFile(path.join(f.root, 'expo-stopped.log'), 'utf8'), 'stopped');
      await writeFile(
        path.join(f.root, 'src/index.ts'),
        "export const message: string = 'fixed';\n",
      );
      await f.ready(cycle + 1);
    }
  },
);

test(
  'removing a JavaScript lint error automatically restarts Expo',
  { timeout: 20000 },
  async (t) => {
    const f = await fixture(t);
    await f.ready();
    await writeFile(path.join(f.root, 'src/unused.js'), 'const unused = 1;\nexport {};\n');
    await f.paused();
    assert.equal(f.child.exitCode, null);
    assert.match(f.output(), /error.*unused-imports\/no-unused-vars/);
    assert.equal(await readFile(path.join(f.root, 'expo-stopped.log'), 'utf8'), 'stopped');
    await rm(path.join(f.root, 'src/unused.js'));
    await f.ready(2);
  },
);

test('Ctrl+C exits even when validation is paused', { timeout: 20000 }, async (t) => {
  const f = await fixture(t, 'let x = 0;\nexport {};\n');
  await f.paused();
  f.child.kill('SIGINT');
  assert.equal((await f.exited)[0], 130);
  assert.doesNotMatch(f.output(), /EXPO_FIXTURE_READY/);
});

test(
  'valid edits keep Expo running and shutdown cleans up the child',
  { timeout: 20000 },
  async (t) => {
    const f = await fixture(t);
    await f.ready();
    const firstPassCount = f.output().split('TypeScript and ESLint passed.').length;
    await writeFile(
      path.join(f.root, 'src/index.ts'),
      "export const message: string = 'updated';\n",
    );
    let rechecked = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      if (f.output().split('TypeScript and ESLint passed.').length > firstPassCount) {
        rechecked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(rechecked, f.output());
    assert.equal(f.child.exitCode, null, f.output());
    f.child.kill('SIGINT');
    assert.equal((await f.exited)[0], 130);
    assert.equal(await readFile(path.join(f.root, 'expo-stopped.log'), 'utf8'), 'stopped');
  },
);
