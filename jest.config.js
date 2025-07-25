module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tst/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '@ben1000240/instantlyanalyze-components': '<rootDir>/../InstantlyAnalyze-Components/src/index.ts',
    '@ben1000240/instantlyanalyze-layouts': '<rootDir>/../InstantlyAnalyze-Layouts/src/index.ts',
    '@ben1000240/instantlyanalyze-module': '<rootDir>/../InstantlyAnalyze-Module/src/index.ts',
    '@cloudscape-design/global-styles': '<rootDir>/src/__mocks__/@cloudscape-design/global-styles.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@cloudscape-design)/)',
  ],
  testMatch: ['**/tst/**/*.[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/tst'],
}; 