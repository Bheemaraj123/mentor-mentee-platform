import type { FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import {
  CheckCircle,
  Clock,
  Users,
  Flag,
  RefreshCw,
} from 'lucide-react';

interface DashboardMetrics {
  assigned_mentor?: string | null;
  pending_tasks?: number;
  completed_tasks?: number;
  overdue_tasks?: number;
}

interface MenteeTask {
  id: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface UpdateTaskStatusVariables {
  taskId: number;
  status: string;
}

export const MenteeDashboard: FC = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  // Fetch dashboard metrics
  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardMetrics>({
    queryKey: ['mentee-dashboard'],
    queryFn: async () => {
      const response = await api.get('/mentee/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  // Fetch assigned tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorMessage,
    refetch,
  } = useQuery<MenteeTask[]>({
    queryKey: ['mentee-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/mentee', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  // Update task status
  const updateStatusMutation = useMutation({
    mutationKey: ['mentee-update-task-status'],

    mutationFn: async (variables: UpdateTaskStatusVariables) => {
      const response = await api.put(
        `/tasks/${variables.taskId}`,
        {
          status: variables.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['mentee-tasks'],
      });

      await queryClient.invalidateQueries({
        queryKey: ['mentee-dashboard'],
      });
    },
  });

  // Dashboard loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">
          Mentee Dashboard
        </h2>

        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Dashboard error state
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">
          Mentee Dashboard
        </h2>

        <p className="text-red-500">
          Error: {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Mentee Dashboard
      </h1>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

          {/* Assigned Mentor */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Assigned Mentor
                </p>

                <h3 className="text-2xl font-bold mt-1">
                  {metrics.assigned_mentor || '—'}
                </h3>
              </div>

              <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Pending Tasks
                </p>

                <h3 className="text-2xl font-bold mt-1">
                  {metrics.pending_tasks ?? 0}
                </h3>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 text-yellow-600 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Completed Tasks
                </p>

                <h3 className="text-2xl font-bold mt-1">
                  {metrics.completed_tasks ?? 0}
                </h3>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Overdue Tasks
                </p>

                <h3 className="text-2xl font-bold mt-1">
                  {metrics.overdue_tasks ?? 0}
                </h3>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 rounded-lg">
                <Flag className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            My Tasks
          </h2>

          <button
            onClick={() => refetch()}
            disabled={tasksLoading}
            className="flex items-center gap-2 px-3 py-1 rounded text-sm border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                tasksLoading ? 'animate-spin' : ''
              }`}
            />

            {tasksLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {tasksLoading && (
          <p className="text-sm text-gray-500">
            Loading tasks...
          </p>
        )}

        {tasksError && (
          <p className="text-sm text-red-500">
            Error:{' '}
            {tasksErrorMessage instanceof Error
              ? tasksErrorMessage.message
              : String(tasksErrorMessage)}
          </p>
        )}

        {!tasksLoading && !tasksError && tasks.length > 0 && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-colors ${
                  task.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : task.status === 'overdue'
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className={cn(
                        'font-semibold',
                        task.status === 'completed'
                          ? 'text-green-900 dark:text-green-100'
                          : task.status === 'overdue'
                          ? 'text-red-900 dark:text-red-100'
                          : 'text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {task.title}
                    </h4>

                    <p className="text-sm text-gray-500 truncate line-clamp-1">
                      {task.description || 'No description'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-800'
                          : task.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:border-red-800'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:border-blue-800'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'pending'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:border-gray-600'
                          : task.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800'
                          : task.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:border-red-800'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Due:{' '}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : 'No deadline'}
                </div>

                <div className="mt-2 flex gap-1">
                  <button
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        taskId: task.id,
                        status:
                          task.status === 'pending'
                            ? 'in_progress'
                            : task.status === 'in_progress'
                            ? 'completed'
                            : 'pending',
                      })
                    }
                    className="px-2 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {task.status === 'pending'
                      ? 'Start'
                      : task.status === 'in_progress'
                      ? 'Complete'
                      : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!tasksLoading && !tasksError && tasks.length === 0 && (
          <p className="text-sm text-gray-500 no-tasks-message">
            No tasks assigned yet.
          </p>
        )}
      </div>
    </div>
  );
};