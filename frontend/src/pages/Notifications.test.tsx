
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

import { api } from '@/services/api';
import Notifications from '@/pages/Notifications';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
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

    expect(
      await screen.findAllByText('New report request')
    ).toHaveLength(2);

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
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    render(<Notifications />, { wrapper: createWrapper() });

    fireEvent.click(
      await screen.findByRole('button', { name: /mark as read/i })
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/notifications/1/read');
      expect(screen.getByText('Unread')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /unread\s*0/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /mark as read/i })
    ).not.toBeInTheDocument();
  });

  it('marks all as read', async () => {
    mockInitialRequests();
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

    render(<Notifications />, { wrapper: createWrapper() });

    fireEvent.click(
      await screen.findByRole('button', { name: /mark all read/i })
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
    });

    expect(
      screen.getByRole('button', { name: /unread\s*0/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /mark all read/i })
    ).not.toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: { count: 0 } });

    render(<Notifications />, { wrapper: createWrapper() });

    expect(await screen.findByText('No notifications')).toBeInTheDocument();
  });
});
