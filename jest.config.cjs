/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: [
    '**/apps/api/src/**/__tests__/**/*.spec.ts',
    '**/apps/api/test/**/*.spec.ts',
    '**/apps/admin-web/lib/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
  },
  setupFilesAfterEnv: [],
};

