module.exports = async () => {
  return {
    roots: ['<rootDir>'],
    transform: {
      '^.+\\.tsx?$': [
        '@swc/jest',
        {
          sourceMaps: true,
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: false,
            },
            target: 'es2020',
          },
        },
      ],
    },
    collectCoverageFrom: ['src/**/*.ts'],
    coveragePathIgnorePatterns: [
      'node_modules',
      'interfaces',
      '<rootDir>/src/index.ts',
      '.mock.ts',
    ],
    coverageDirectory: '<rootDir>/coverage/',
    logHeapUsage: true,
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.setup.js'],
    resetMocks: true,
    maxWorkers: '50%',
    maxConcurrency: 10,
    reporters: ['default'],
  };
};
