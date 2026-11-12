import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import Notifications from '@/pages/Notifications';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock API
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from '@/services/api';

// Mock useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', full_name: 'Test User', role: 'mentor' },
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

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notifications list', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: [
        { id: 1, notification_type: 'request', message: 'New report request', is_read: false, created_at: '2026-11-10T10:00:00Z', related_entity_id: 1, related_entity_type: 'report_request' },
        { id: 2, notification_type: 'report_shared', message: 'Report shared with you', is_read: true, created_at: '2026-11-09T10:00:00Z', related_entity_id: 2, related_entity_type: 'report' },
      ]})
      .mockResolvedValueOnce({ data: { count: 1 } });

    render(<Notifications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
      expect(screen.getByText('New report request')).toBeInTheDocument();
      expect(screen.getByText('Report shared with you')).toBeInTheDocument();
    });
  });

  it('shows unread count badge', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: [{ id: 1, notification_type: 'request', message: 'Test', is_read: false, created_at: '2026-11-10T10:00:00Z' }] })
      .mockResolvedValueOnce({ data: { count: 1 } });

    render(<Notifications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('1 unread')).toBeInTheDocument();
    });
  });

  it('marks notification as read on click', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: [{ id: 1, notification_type: 'request', message: 'Test', is_read: false, created_at: '2026-11-10T10:00:00Z' }] })
      .mockResolvedValueOnce({ data: { count: 1 } });

    render(<Notifications />, { wrapper: createWrapper() });

    await waitFor(() => {
      const markAsReadButton = screen.getByTitle('Mark as read');
      fireEvent.click(markAsReadButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/notifications/1/read');
    });
  });

  it('marks all as read', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: [{ id: 1, notification_type: 'request', message: 'Test', is_read: false, created_at: '2026-11-10T10:00:00Z' }] })
      .mockResolvedValueOnce({ data: { count: 1 } });

    render(<Notifications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  it('shows empty state when no notifications', async () => {
    (api.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: { count: 0 } });

    render(<Notifications />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });
});