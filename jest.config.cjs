module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
  },
  testPathIgnorePatterns: ['node_modules', 'dist'],
  restoreMocks: true,
  coveragePathIgnorePatterns: ['node_modules', 'dist'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  transform: { '\\.ts$': ['ts-jest'] },
};
