import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Settings } from '@/pages/Settings';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock API
vi.mock('@/services/api', () => ({
  api: {
    put: vi.fn(),
    post: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

import { api } from '@/services/api';

// Mock useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', full_name: 'Test User', role: 'mentor', created_at: '2026-01-01T00:00:00Z' },
    updateUser: vi.fn(),
    logout: vi.fn(),
  }),
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
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile and password sections', async () => {
    render(<Settings />, { wrapper: createWrapper() });

    expect(screen.getByText(/profile information/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();

    // Switch to Security tab to see password fields
    const securityTab = screen.getByRole('button', { name: /security/i });
    fireEvent.click(securityTab);

    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('shows current user data in profile form', () => {
    render(<Settings />, { wrapper: createWrapper() });

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mentor')).toBeInTheDocument();
  });

  it('updates profile on submit', async () => {
    (api.put as any).mockResolvedValue({
      data: { id: 1, email: 'test@example.com', full_name: 'Updated Name', role: 'mentor' },
    });

    render(<Settings />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/auth/profile', { full_name: 'Updated Name' });
    });
  });

  it('shows error when current password is wrong', async () => {
    (api.post as any).mockRejectedValue({
      response: { data: { detail: 'Current password is incorrect' } },
    });

    render(<Settings />, { wrapper: createWrapper() });

    // Switch to Security tab
    fireEvent.click(screen.getByRole('button', { name: /security/i }));

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'Wrong@123' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'NewPass@123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'NewPass@123' } });
    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
    });
  });

  it('shows error when new passwords do not match', async () => {
    render(<Settings />, { wrapper: createWrapper() });

    // Switch to Security tab
    fireEvent.click(screen.getByRole('button', { name: /security/i }));

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'Test@123' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'NewPass@123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'Different@123' } });
    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for weak new password', async () => {
    render(<Settings />, { wrapper: createWrapper() });

    // Switch to Security tab
    fireEvent.click(screen.getByRole('button', { name: /security/i }));

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'Test@123' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});