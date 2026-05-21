/**
 * lint-staged configuration — .lintstagedrc.cjs
 *
 * Why .cjs instead of .json?
 * On Windows, lint-staged appends ALL matched file paths as CLI arguments.
 * With 90+ JSON/Markdown files staged at once the command line exceeds
 * Windows's 8191-character limit and Prettier fails with
 * "The command line is too long."
 *
 * The function form for "**\/*.{json,md}" returns a fixed command string
 * WITHOUT appending individual filenames, so Prettier runs once on "."
 * and the length limit is never hit.
 */

module.exports = {
  // TypeScript / TSX — ESLint fix then Prettier
  // Use npx so the locally-installed binaries are found on Windows
  // (bare 'eslint' / 'prettier' fail when node_modules/.bin is not in PATH)
  'frontend/src/**/*.{ts,tsx}': [
    'npx eslint --fix --max-warnings=0',
    'npx prettier --write',
  ],

  // Backend JS — ESLint only
  'backend/src/**/*.js': [
    'npx eslint --fix --max-warnings=0',
  ],

  // JSON + Markdown — use function to avoid "command line too long" on Windows.
  // Returning a plain string means lint-staged runs it once, not once-per-file,
  // and does NOT append staged filenames to the command.
  '**/*.{json,md}': () => 'npx prettier --write .',
};
