import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const roots = new Set(['api', 'src', 'server', 'shared', 'scripts', 'tests', 'docs', 'wordpress']);
const sourceExtensions = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.css',
  '.json',
  '.py',
  '.php',
  '.md',
  '.html',
]);
const problems = [];

function originalName(name, isDirectory) {
  const extension = isDirectory ? '' : path.extname(name);
  const stem = extension ? name.slice(0, -extension.length) : name;
  return stem.replace(/ (?:\d+|\(\d+\)|copy(?: \d+)?)$/i, '') + extension;
}

async function exists(filename) {
  try {
    return await stat(filename);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function inspect(directory, topLevel = false) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    const relative = path.relative(root, filename).split(path.sep).join('/');
    const original = originalName(entry.name, entry.isDirectory());
    const source =
      sourceExtensions.has(path.extname(entry.name)) || entry.name.startsWith('.nvmrc');
    if (original !== entry.name && (entry.isDirectory() || source)) {
      const sibling = await exists(path.join(directory, original));
      if (sibling && sibling.isDirectory() === entry.isDirectory()) {
        problems.push(`${relative}: duplicate working copy of ${original}`);
      }
    }
    if (entry.isDirectory()) {
      if (!topLevel || roots.has(entry.name)) await inspect(filename);
    } else if (
      relative.startsWith('api/') &&
      /\.(?:[cm]?js|jsx|ts|tsx|py|go|rb)$/.test(entry.name)
    ) {
      if (/\s/.test(relative) || relative.length >= 128)
        problems.push(`${relative}: invalid Vercel function name`);
    }
  }
}

await inspect(root, true);
if (problems.length) {
  console.error(
    `Source file check failed:\n${problems.map((problem) => `- ${problem}`).join('\n')}\nKeep the canonical files and move backup copies outside the source folders.`,
  );
  process.exitCode = 1;
} else {
  console.log('Source file check passed: no duplicate working copies or invalid API filenames.');
}
