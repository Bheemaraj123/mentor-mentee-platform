import type { FC } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../services/api';

interface ProgressReport {
  id: number;
  mentee_id?: number;
  mentee_full_name?: string | null;
  mentee_email?: string | null;
  meeting_title: string;
  meeting_date: string;
  status: string;
}

interface ProgressTask {
  id: number;
  title?: string;
  status: string;
  deadline?: string | null;
  created_at?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  pending_review:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  shared: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATUS_CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#e74c3c',
];

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getStatusClass = (status: string): string =>
  STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

const ProgressError: FC<{ message: string }> = ({ message }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
    <h2 className="text-xl font-bold mb-2">Progress Analytics</h2>
    <p className="text-red-500">Error: {message}</p>
  </div>
);

export const MentorProgress: FC = () => {
  const token = localStorage.getItem('token');

  // Fetch mentor reports
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
  } = useQuery<ProgressReport[]>({
    queryKey: ['mentor-progress-reports'],
    queryFn: async () => {
      const response = await api.get('/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  // Fetch mentor tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorDetails,
  } = useQuery<ProgressTask[]>({
    queryKey: ['mentor-tasks-progress'],
    queryFn: async () => {
      const response = await api.get('/tasks/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  // Calculate unique mentees
  const totalMentees = useMemo(() => {
    const menteeIds = new Set<number>();

    reports.forEach((report) => {
      if (report.mentee_id !== undefined) {
        menteeIds.add(report.mentee_id);
      }
    });

    return menteeIds.size;
  }, [reports]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === 'completed'
  ).length;
  const pendingTasks = tasks.filter(
    (task) => task.status === 'pending'
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === 'in_progress'
  ).length;

  const overdueTasks = tasks.filter((task) => {
    if (!task.deadline || task.status === 'completed') {
      return false;
    }

    return new Date(task.deadline).getTime() < Date.now();
  }).length;

  const completedRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Report status distribution
  const reportStatusData = useMemo(() => {
    const counts: Record<string, number> = {};

    reports.forEach((report) => {
      counts[report.status] = (counts[report.status] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [reports]);

  // Task completion trend, grouped by creation date
  const taskTrendData = useMemo(() => {
    const groupedTasks: Record<
      string,
      { total: number; completed: number }
    > = {};

    tasks.forEach((task) => {
      const date = task.created_at
        ? new Date(task.created_at).toLocaleDateString()
        : 'Unknown';

      if (!groupedTasks[date]) {
        groupedTasks[date] = {
          total: 0,
          completed: 0,
        };
      }

      groupedTasks[date].total += 1;

      if (task.status === 'completed') {
        groupedTasks[date].completed += 1;
      }
    });

    return Object.entries(groupedTasks)
      .map(([date, values]) => ({
        date,
        total: values.total,
        completed: values.completed,
      }))
      .slice(-10);
  }, [tasks]);

  if (isLoading || tasksLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Progress Analytics</h2>
        <p>Loading progress data...</p>
      </div>
    );
  }

  if (isError) {
    return <ProgressError message={getErrorMessage(error)} />;
  }

  if (tasksError) {
    return <ProgressError message={getErrorMessage(tasksErrorDetails)} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progress Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Total Mentees</h3>
          <h2 className="text-2xl font-bold mt-1">{totalMentees}</h2>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Task Completion Rate</h3>
          <h2 className="text-2xl font-bold mt-1">
            {completedRate.toFixed(1)}%
          </h2>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Total Tasks</h3>
          <h2 className="text-2xl font-bold mt-1">{totalTasks}</h2>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Completed Tasks</h3>
          <h2 className="text-2xl font-bold mt-1">{completedTasks}</h2>
        </div>
      </div>

      {/* Report Status Distribution */}
      {reportStatusData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Report Status Distribution
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {reportStatusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        STATUS_CHART_COLORS[
                          index % STATUS_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Task Status Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Task Status Distribution
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <h4 className="text-xs font-medium mb-1">Completed</h4>
            <h2 className="text-2xl font-bold">{completedTasks}</h2>
          </div>

          <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <h4 className="text-xs font-medium mb-1">In Progress</h4>
            <h2 className="text-2xl font-bold">{inProgressTasks}</h2>
          </div>

          <div className="p-3 rounded-lg bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            <h4 className="text-xs font-medium mb-1">Pending</h4>
            <h2 className="text-2xl font-bold">{pendingTasks}</h2>
          </div>

          <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <h4 className="text-xs font-medium mb-1">Overdue</h4>
            <h2 className="text-2xl font-bold">{overdueTasks}</h2>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2">Meeting Title</th>
                  <th className="text-left p-2">Mentee</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {reports.slice(0, 10).map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-2 truncate max-w-xs">
                      {report.meeting_title}
                    </td>

                    <td className="p-2">
                      {report.mentee_full_name ||
                        report.mentee_email ||
                        '—'}
                    </td>

                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td className="p-2">
                      {report.meeting_date
                        ? new Date(
                            report.meeting_date
                          ).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Completion Trend */}
      {taskTrendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Task Completion Trend
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={taskTrendData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed Tasks"
                  stroke="#8884d8"
                />

                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Tasks"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export const MenteeProgress: FC = () => {
  const token = localStorage.getItem('token');

  // Fetch mentee reports
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
  } = useQuery<ProgressReport[]>({
    queryKey: ['mentee-progress-reports'],
    queryFn: async () => {
      const response = await api.get('/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  // Fetch mentee tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorDetails,
  } = useQuery<ProgressTask[]>({
    queryKey: ['mentee-progress-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === 'completed'
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === 'pending'
  ).length;

  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const reportHistory = useMemo(
    () =>
      reports.map((report) => ({
        id: report.id,
        title: report.meeting_title,
        date: report.meeting_date
          ? new Date(report.meeting_date).toLocaleDateString()
          : '—',
        status: report.status,
      })),
    [reports]
  );

  if (isLoading || tasksLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Progress Analytics</h2>
        <p>Loading progress data...</p>
      </div>
    );
  }

  if (isError) {
    return <ProgressError message={getErrorMessage(error)} />;
  }

  if (tasksError) {
    return <ProgressError message={getErrorMessage(tasksErrorDetails)} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progress Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Completion Rate</h3>
          <h2 className="text-2xl font-bold mt-1">
            {completionRate.toFixed(1)}%
          </h2>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Total Tasks</h3>
          <h2 className="text-2xl font-bold mt-1">{totalTasks}</h2>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm text-gray-500">Reports Received</h3>
          <h2 className="text-2xl font-bold mt-1">{reports.length}</h2>
        </div>
      </div>

      {/* Report History */}
      {reportHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Report History</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2">Meeting</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {reportHistory.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-2 truncate max-w-xs">
                      {report.title}
                    </td>

                    <td className="p-2">{report.date}</td>

                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Completion Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Task Completion</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <h4 className="text-xs text-gray-500 mb-1">Completed</h4>
            <h2 className="text-2xl font-bold mt-1">{completedTasks}</h2>
          </div>

          <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <h4 className="text-xs text-gray-500 mb-1">Pending</h4>
            <h2 className="text-2xl font-bold mt-1">{pendingTasks}</h2>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {completedTasks} of {totalTasks} tasks completed (
          {completionRate.toFixed(1)}%)
        </p>
      </div>
    </div>
  );
};