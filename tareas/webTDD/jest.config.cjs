/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: '<rootDir>/src/tests/IndexedDbEnvironment.cjs',
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|svg|webp|avif)$': '<rootDir>/src/tests/fileMock.cjs',
  },
  clearMocks: true,
  restoreMocks: true,
  passWithNoTests: true,
}
