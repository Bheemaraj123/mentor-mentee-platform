
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import Notifications from '@/pages/Notifications';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from '@/services/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'mentor',
    },
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
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const mockNotifications = [
  {
    id: 1,
    title: 'Test notification',
    message: 'Test message',
    notification_type: 'request',
    is_read: false,
    created_at: '2026-11-10T10:00:00Z',
    related_entity_id: 1,
  },
];

const mockInitialRequests = () => {
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: mockNotifications })
    .mockResolvedValueOnce({ data: { count: 1 } });
};

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders notifications list', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            ...mockNotifications[0],
            title: 'New report request',
            message: 'New report request',
          },
          {
            id: 2,
            title: 'Report shared',
            message: 'Report shared with you',
            notification_type: 'report_shared',
            is_read: true,
            created_at: '2026-11-09T10:00:00Z',
            related_entity_id: 2,
          },
        ],
      })
      .mockResolvedValueOnce({ data: { count: 1 } });

    render(<Notifications />, { wrapper: createWrapper() });

    expect(await screen.findByText('New report request')).toBeInTheDocument();
    expect(screen.getByText('Report shared with you')).toBeInTheDocument();
  });

  it('shows unread count', async () => {
    mockInitialRequests();

    render(<Notifications />, { wrapper: createWrapper() });

    expect(
      await screen.findByRole('button', { name: /unread\s*1/i })
    ).toBeInTheDocument();
  });

  it('marks notification as read on click', async () => {
    mockInitialRequests();
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Success' } });

    render(<Notifications />, { wrapper: createWrapper() });

    const markAsReadButton = await screen.findByRole('button', {
      name: /mark as read/i,
    });

    fireEvent.click(markAsReadButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/notifications/1/read');
    });

    expect(await screen.findByText('Marked as read')).toBeInTheDocument();
  });

  it('marks all as read', async () => {
    mockInitialRequests();
    vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Success' } });

    render(<Notifications />, { wrapper: createWrapper() });

    const markAllButton = await screen.findByRole('button', {
      name: /mark all read/i,
    });

    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
    });

    expect(
      await screen.findByText('All notifications marked as read')
    ).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: { count: 0 } });

    render(<Notifications />, { wrapper: createWrapper() });

    expect(await screen.findByText('No notifications')).toBeInTheDocument();
  });
});
