import React from 'react';

export const Footer = () => <div data-testid="footer">Footer</div>;
export const AuthenticatedPage = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="auth-page">{children}</div>
);
export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="error-boundary">{children}</div>
);
export const AppLayoutPreview = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="app-layout">{children}</div>
);
export const Header = () => <div data-testid="header">Header</div>;
export const LoadingBar = () => <div data-testid="loading-bar">Loading</div>;
export const useAppContext = () => ({
  getAppDensity: () => 'comfortable',
  getAppMode: () => 'light',
}); 