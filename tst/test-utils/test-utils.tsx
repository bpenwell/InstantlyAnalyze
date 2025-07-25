import React, { ReactNode } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

// Types
interface Auth0Options {
  isAuthenticated?: boolean;
  user?: any;
  isLoading?: boolean;
  loginWithRedirect?: jest.Mock;
  logout?: jest.Mock;
}

interface ProvidersProps {
  children: ReactNode;
  auth0Options?: Auth0Options;
}

interface RenderOptions {
  auth0Options?: Auth0Options;
  [key: string]: any;
}

// Default auth0 mock values
const defaultAuth0Options: Auth0Options = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  loginWithRedirect: jest.fn(),
  logout: jest.fn(),
};

// Default test wrapper with all providers
const AllTheProviders = ({ children, auth0Options = {} }: ProvidersProps) => {
  const mockAuth0 = {
    ...defaultAuth0Options,
    ...auth0Options,
  };

  return (
    <Auth0Provider
      domain="test-domain.auth0.com"
      clientId="test-client-id"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Auth0Provider>
  );
};

// Custom render function that includes providers
const render = (ui: React.ReactElement, options: RenderOptions = {}) => {
  const { auth0Options, ...renderOptions } = options;
  return rtlRender(ui, {
    wrapper: (props) => <AllTheProviders {...props} auth0Options={auth0Options} />,
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { render };

// Common test data
export const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  sub: 'auth0|123456789',
};

// Common test utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0)); 