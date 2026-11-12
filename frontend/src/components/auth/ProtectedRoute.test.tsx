import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUseAuth = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has correct role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'mentor@example.com', full_name: 'Test Mentor', role: 'mentor' },
      isLoading: false,
      logout: vi.fn(),
    });

    const TestComponent = () => <div>Protected Content</div>;

    render(
      <ProtectedRoute allowedRoles={['mentor']}>
        <TestComponent />
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when user does not have correct role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'mentee@example.com', full_name: 'Test Mentee', role: 'mentee' },
      isLoading: false,
      logout: vi.fn(),
    });

    const TestComponent = () => <div>Protected Content</div>;

    render(
      <ProtectedRoute allowedRoles={['mentor']}>
        <TestComponent />
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      logout: vi.fn(),
    });

    const TestComponent = () => <div>Protected Content</div>;

    render(
      <ProtectedRoute allowedRoles={['mentor']}>
        <TestComponent />
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    );

    // Loading state shows a spinner, let's check container or not.
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      logout: vi.fn(),
    });

    const TestComponent = () => <div>Protected Content</div>;

    render(
      <ProtectedRoute allowedRoles={['mentor']}>
        <TestComponent />
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
