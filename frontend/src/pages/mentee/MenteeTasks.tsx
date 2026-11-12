import type { FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';

interface MenteeTask {
  id: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority: string;
  status: string;
}

export const MenteeTasks: FC = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  // Fetch assigned tasks
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MenteeTask[]>({
    queryKey: ['mentee-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/', {
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
    mutationFn: async (variables: { taskId: number; status: string }) => {
      const response = await api.put(
        `/tasks/${variables.taskId}`,
        { status: variables.status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['mentee-tasks'],
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">My Tasks</h2>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">My Tasks</h2>
        <p className="text-red-500">Error: {errorMessage}</p>

        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Tasks</h1>

      {/* Tasks List */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                task.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : task.status === 'overdue'
                  ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
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
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:border-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:border-blue-800'
                    )}
                  >
                    {task.priority}
                  </span>

                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-800'
                        : task.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:border-gray-600'
                    )}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Due:{' '}
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString()
                  : 'No deadline'}
              </div>

              <div className="mt-2 flex gap-1">
                <button
                  disabled={updateStatusMutation.isPending}
                  onClick={() => {
                    const nextStatus =
                      task.status === 'pending'
                        ? 'in_progress'
                        : task.status === 'in_progress'
                        ? 'completed'
                        : 'pending';

                    updateStatusMutation.mutate({
                      taskId: task.id,
                      status: nextStatus,
                    });
                  }}
                  className="px-2 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {updateStatusMutation.isPending
                    ? 'Updating...'
                    : task.status === 'pending'
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

      {tasks.length === 0 && (
        <p className="text-sm text-gray-500 no-tasks-message">
          No tasks assigned yet.
        </p>
      )}
    </div>
  );
};