import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Users, FileText, Clock, CheckCircle } from 'lucide-react';

import { api } from '../../services/api';
import { cn } from '../../lib/utils';

interface TaskFormData {
  title: string;
  description?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
}

interface Task {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
}

interface DashboardMetrics {
  total_mentees?: number;
  reports_generated?: number;
  pending_requests?: number;
  completed_tasks?: number;
}

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export const MentorDashboard = () => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<TaskFormData>({
    defaultValues: {
      title: 'New task',
      priority: 'medium',
    },
  });

  // Fetch dashboard metrics
  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardMetrics>({
    queryKey: ['mentor-dashboard'],
    queryFn: async () => {
      const response = await api.get(
        '/tasks/dashboard',
        getAuthConfig()
      );
      return response.data;
    },
  });

  // Fetch tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['mentor-tasks'],
    queryFn: async () => {
      const response = await api.get(
        '/tasks/',
        getAuthConfig()
      );
      return response.data;
    },
  });

  // Create task
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await api.post(
        '/tasks/',
        {
          title: data.title,
          description: data.description,
          deadline: data.deadline || null,
          priority: data.priority,
        },
        getAuthConfig()
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
      reset({
        title: '',
        priority: 'medium',
      });
    },
  });

  // Update task status
  const updateStatusMutation = useMutation({
    mutationFn: async (variables: {
      taskId: number;
      status: string;
    }) => {
      const response = await api.put(
        `/tasks/${variables.taskId}`,
        { status: variables.status },
        getAuthConfig()
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
    },
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await api.delete(
        `/tasks/${taskId}`,
        getAuthConfig()
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
    },
  });

  // Handle form submission
  const onSubmit = (data: TaskFormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">
          Mentor Dashboard
        </h2>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-2">
          Mentor Dashboard
        </h2>
        <p className="text-red-500">
          Error: {error instanceof Error ? error.message : 'Failed to load dashboard'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-blue-600 text-white px-4 py-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Mentor Dashboard Overview
      </h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Mentees</p>
              <h3 className="text-2xl font-bold mt-1">
                {metrics?.total_mentees ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reports Generated</p>
              <h3 className="text-2xl font-bold mt-1">
                {metrics?.reports_generated ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <h3 className="text-2xl font-bold mt-1">
                {metrics?.pending_requests ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 text-yellow-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Tasks</p>
              <h3 className="text-2xl font-bold mt-1">
                {metrics?.completed_tasks ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Task Management */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Task Management
        </h2>

        <div className="flex gap-3 mb-3">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex flex-wrap gap-2"
          >
            <input
              {...register('title', { required: true })}
              type="text"
              placeholder="Task title"
              className="flex-1 min-w-40 rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 outline-none"
            />

            <select
              {...register('priority', { required: true })}
              className="rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary text-white py-2 px-4 font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-secondary text-white py-2 px-4 font-medium hover:bg-secondary/90"
          >
            Refresh
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-500 mb-3">
            Failed to create task: {createMutation.error.message}
          </p>
        )}

        {updateStatusMutation.isError && (
          <p className="text-sm text-red-500 mb-3">
            Failed to update task status.
          </p>
        )}

        {deleteMutation.isError && (
          <p className="text-sm text-red-500 mb-3">
            Failed to delete task.
          </p>
        )}

        {tasksLoading && (
          <p className="text-sm text-gray-500">
            Loading tasks...
          </p>
        )}

        {tasksError && (
          <p className="text-sm text-red-500">
            Failed to load tasks.
          </p>
        )}

        {!tasksLoading && !tasksError && tasks.length > 0 && (
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
                    <h4 className="font-semibold">
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-500 truncate line-clamp-1">
                      {task.description || 'No description'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900">
                      {task.priority}
                    </span>

                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700">
                      {task.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Due: {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : 'No deadline'}
                </div>

                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
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
                    className="px-2 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {task.status === 'pending'
                      ? 'Start'
                      : task.status === 'in_progress'
                      ? 'Complete'
                      : 'Reactivate'}
                  </button>

                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(task.id)}
                    className="px-2 py-1 rounded text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!tasksLoading && !tasksError && tasks.length === 0 && (
          <p className="text-sm text-gray-500 no-tasks-message">
            No tasks found. Create one above to get started.
          </p>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;