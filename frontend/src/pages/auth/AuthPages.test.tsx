
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

import { api } from '@/services/api';

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
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password fields', () => {
    render(<Login />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<Login />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/^password is required$/i)).toBeInTheDocument();
    });
  });

  it('shows error for invalid email format', async () => {
    render(<Login />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Test@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('calls API on successful submit', async () => {
    (api.post as any).mockResolvedValue({
      data: {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'mentor',
        },
      },
    });

    render(<Login />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Test@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Test@123',
      });
    });
  });

  it('displays API error message', async () => {
    (api.post as any).mockRejectedValue({
      response: { data: { detail: 'Invalid credentials' } },
    });

    render(<Login />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Test@123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form with all fields', () => {
    render(<Register />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/^full name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email address$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /mentor/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /mentee/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<Register />, { wrapper: createWrapper() });

    fireEvent.click(
      screen.getByRole('button', { name: /create account/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/^password is required$/i)).toBeInTheDocument();
      expect(
        screen.getByText(/confirm password is required/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<Register />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/^full name$/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Test@123' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
      target: { value: 'Different@123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /create account/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows error for weak password', async () => {
    render(<Register />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/^full name$/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'weak' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
      target: { value: 'weak' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /create account/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('calls API on successful registration', async () => {
    (api.post as any).mockResolvedValue({
      data: {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'mentor',
        },
      },
    });

    render(<Register />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText(/^full name$/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/^email address$/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Test@123' },
    });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), {
      target: { value: 'Test@123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /create account/i })
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'mentor',
      });
    });
  });
});