/**
 * lint-staged configuration — .lintstagedrc.cjs
 *
 * Windows notes:
 * 1. Use `npx` — bare `eslint`/`prettier` are not on the PATH.
 * 2. ESLint v9 requires the config file to be in the same directory tree it
 *    runs from.  Frontend files must be linted from inside frontend/ so that
 *    frontend/eslint.config.js is discovered.  We use the function form to
 *    build a `cd frontend && npx eslint …` command with relative paths.
 * 3. The JSON/Markdown entry uses the function form (returns a fixed string
 *    instead of appending filenames) to stay under the 8191-char Windows
 *    command-line limit.
 */

module.exports = {
  // TypeScript / TSX — run ESLint from frontend/ so eslint.config.js is found
  'frontend/src/**/*.{ts,tsx}': (files) => {
    const rel = files.map((f) => f.replace(/\\/g, '/').replace(/^.*?frontend\//, ''));
    return [
      `cd frontend && npx eslint --fix --max-warnings=0 ${rel.join(' ')}`,
      `npx prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
    ];
  },

  // Backend JS — run from backend/ so any future eslint.config.js is found
  'backend/src/**/*.js': (files) => {
    const rel = files.map((f) => f.replace(/\\/g, '/').replace(/^.*?backend\//, ''));
    return `cd backend && npx eslint --fix --max-warnings=0 ${rel.join(' ')}`;
  },

  // JSON + Markdown — fixed command, no per-file expansion (avoids 8191-char limit)
  '**/*.{json,md}': () => 'npx prettier --write .',
};
