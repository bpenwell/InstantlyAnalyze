// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Auth0 SPA JS to avoid secure origin requirement
jest.mock('@auth0/auth0-spa-js', () => ({
  Auth0Client: jest.fn().mockImplementation(() => ({
    getTokenSilently: jest.fn(),
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    handleRedirectCallback: jest.fn(),
    isAuthenticated: jest.fn(),
    getUser: jest.fn(),
  })),
}));

// Mock window.location for Auth0
const location = new URL('https://localhost');
Object.defineProperty(window, 'location', {
  value: location,
  writable: true,
});

// Mock window.crypto for Auth0
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn(),
    },
    getRandomValues: jest.fn(),
  },
});

// Mock fetch for Stripe and other HTTP requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock Stripe for tests
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
  }));
});