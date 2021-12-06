module.exports = async () => {
  return {
    roots: ['<rootDir>/test/e2e/'],
    transform: {
      '^.+\\.tsx?$': [
        'esbuild-jest',
        {
          sourcemap: true,
        },
      ],
    },
    testTimeout: 90000,
    coveragePathIgnorePatterns: [
      'node_modules',
      'interfaces',
      '<rootDir>/src/index.ts',
      '.mock.ts',
    ],
    logHeapUsage: true,
    testEnvironment: 'node',
    resetMocks: true,
    maxWorkers: '50%',
    maxConcurrency: 1,
    reporters: ['default'],
  };
};
