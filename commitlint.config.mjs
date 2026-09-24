/** Conventional Commits — enforced locally (commit-msg hook) and in CI. */
const commitlintConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'refactor',
        'docs',
        'chore',
        'style',
        'ci',
        'build',
        'perf',
        'revert',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
  },
};

export default commitlintConfig;
