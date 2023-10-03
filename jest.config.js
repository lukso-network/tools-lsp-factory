module.exports = async () => {
  return {
    roots: ['<rootDir>'],
    transform: {
      '^.+\\.(tsx?|jsx?)$': [
        'esbuild-jest',
        {
          sourcemap: true,
          target: 'es2020',
        },
      ],
    },
    transformIgnorePatterns: ['node_modules/(?!(form-data-encoder))/'],
    collectCoverageFrom: ['src/**/*.ts'],
    coveragePathIgnorePatterns: [
      'node_modules',
      'interfaces',
      '<rootDir>/src/index.ts',
      '.mock.ts',
    ],
    coverageDirectory: '<rootDir>/coverage/',
    // ignore coverage for now, enable once the dust has settled
    // coverageThreshold: {
    //   global: {
    //     branches: 40,
    //     functions: 30,
    //     lines: 50,
    //     statements: 50,
    //   },
    // },
    logHeapUsage: true,
    testEnvironment: 'node',
    resetMocks: true,
    setupFilesAfterEnv: ['./jest.setup.ts'],
    maxWorkers: '50%',
    maxConcurrency: 10,
    reporters: ['default'],
  };
};
