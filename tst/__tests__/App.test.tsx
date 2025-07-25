import React from 'react';
import { render, screen, waitForLoadingToFinish, mockUser } from '../test-utils/test-utils';
import { App } from '../../src/App';
import { Mode, Density } from '@cloudscape-design/global-styles';

// Mock local dependencies
jest.mock('@bpenwell/instantlyanalyze-components', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
  AuthenticatedPage: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-page">{children}</div>,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
  AppLayoutPreview: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
  Header: () => <div data-testid="header">Header</div>,
  LoadingBar: () => <div data-testid="loading-bar">Loading</div>,
  useAppContext: () => ({
    getAppDensity: () => 'comfortable',
    getAppMode: () => 'light',
  }),
}));

jest.mock('@bpenwell/instantlyanalyze-layouts', () => ({
  Home: () => <div data-testid="home">Home Page</div>,
  Dashboard: () => <div data-testid="dashboard">Dashboard Page</div>,
  RentalCalculatorHome: () => <div data-testid="rental-calculator">Rental Calculator Page</div>,
  PageNotFound: () => <div data-testid="not-found">404 Page</div>,
  RentalCalculatorCreation: () => <div>Calculator Creation</div>,
  RentalCalculatorCreationV3: () => <div>Calculator Creation V3</div>,
  RentalCalculator: () => <div>Calculator</div>,
  RentEstimatorTool: () => <div>Rent Estimator</div>,
  BRRRRCalculatorTool: () => <div>BRRRR Calculator</div>,
  ComprehensivePropertyAnalysis: () => <div>Property Analysis</div>,
  AIRealEstateAgent: () => <div>AI Agent</div>,
  RentalCalculatorViewV3: () => <div>Calculator View V3</div>,
  ZillowScraperLandingPage: () => <div>Zillow Scraper</div>,
  Profile: () => <div>Profile</div>,
  Subscribe: () => <div>Subscribe</div>,
  HomeV2: () => <div>Home V2</div>,
  PrivacyPolicyAndTerms: () => <div>Privacy Policy</div>,
  MissionPage: () => <div>Mission</div>,
  ContactUs: () => <div>Contact</div>,
  ZillowScraperImportPage: () => <div>Zillow Import</div>,
  SubscribeOutcome: () => <div>Subscribe Outcome</div>,
}));

jest.mock('@bpenwell/instantlyanalyze-module', () => ({
  TOOL_IDS: {
    RENTAL_REPORT: 'rental-report',
    RENT_ESTIMATOR: 'rent-estimator',
    ZILLOW_SCRAPER: 'zillow-scraper',
    BRRRR_CALCULATOR: 'brrrr-calculator',
    COMPREHENSIVE_PROPERTY_ANALYSIS: 'property-analysis',
    AI_REAL_ESTATE_AGENT: 'ai-agent',
  },
  PAGE_PATH: {
    HOME: '/',
    PROFILE: '/profile',
    SUBSCRIBE: '/subscribe',
    SUBSCRIBE_OUTCOME: '/subscribe-outcome',
    MISSION: '/mission',
    CONTACT_US: '/contact',
    DASHBOARD: '/dashboard',
    PRIVACY_POLICY_AND_TERMS: '/privacy-policy',
  },
}));

jest.mock('@auth0/auth0-react', () => ({
  ...jest.requireActual('@auth0/auth0-react'),
  useAuth0: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear any previous mocks and reset window location
    window.history.pushState({}, 'Test page', '/');
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders home page by default', () => {
    render(<App />);
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', async () => {
    render(<App />, {
      auth0Options: {
        isAuthenticated: true,
        user: mockUser,
      },
    });

    await waitForLoadingToFinish();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('handles 404 page for invalid routes', () => {
    window.history.pushState({}, 'Test page', '/invalid-route');
    render(<App />);
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders rental calculator page when navigating to /product/rental-report', () => {
    window.history.pushState({}, 'Test page', '/product/rental-report');
    render(<App />);
    expect(screen.getByTestId('rental-calculator')).toBeInTheDocument();
  });

  it('shows loading state while authenticating', async () => {
    render(<App />, {
      auth0Options: {
        isLoading: true,
      },
    });

    expect(screen.getByTestId('loading-bar')).toBeInTheDocument();
    
    // Wait for loading to finish
    await waitForLoadingToFinish();
  });

  it('applies theme mode from local storage', () => {
    localStorage.setItem('appMode', Mode.Dark);
    render(<App />);
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
  });

  it('applies density from local storage', () => {
    localStorage.setItem('appDensity', Density.Compact);
    render(<App />);
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
  });

  // Clean up localStorage after tests
  afterEach(() => {
    localStorage.clear();
  });
}); 