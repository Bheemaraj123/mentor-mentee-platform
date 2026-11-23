import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
// import { CalendarDays, AlertCircle, CheckCircle2, Clock3, UsersRound } from 'lucide-react';
import { AlertCircle, CheckCircle2, UsersRound } from 'lucide-react';


interface ProgressReport {
  id: number;
  mentee_id?: number;
  mentee_full_name?: string | null;
  mentee_email?: string | null;
  meeting_title: string;
  meeting_date: string;
  status: string;
}

// interface ProgressTask {
//   id: number;
//   title?: string;
//   status: string;
//   deadline?: string | null;
//   created_at?: string | null;
// }

interface ProgressTask {
  id: number;
  title?: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  category?: string | null;
  deadline?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
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
      const response = await api.get('/tasks', {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

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
    const response = await api.get('/tasks/mentee', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
  enabled: !!token,
});

  // Check if mentee has a mentor (connected)
  const hasMentor = tasks.length > 0 || reports.length > 0;

  // Calculate KPI metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
  const pendingTasks = tasks.filter((task) => task.status === 'pending').length;
  const pendingAndInProgress = pendingTasks + inProgressTasks;

  const overdueTasks = tasks.filter((task) => {
    if (!task.deadline || task.status === 'completed') return false;
    return new Date(task.deadline).getTime() < Date.now();
  }).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Circular chart data (Donut chart)
  const chartData = useMemo(() => [
    { name: 'Completed', value: completedTasks, color: '#16a34a' },
    { name: 'Pending', value: pendingAndInProgress, color: '#f59e0b' },
    { name: 'Overdue', value: overdueTasks, color: '#dc2626' },
  ].filter(item => item.value > 0), [completedTasks, pendingAndInProgress, overdueTasks]);

  // Weekly completion activity (last 8 weeks)
  const weeklyActivity = useMemo(() => {
  const weeklyData: Record<string, number> = {};
  const now = new Date();

  // Use local dates consistently to avoid timezone key mismatches.
  const getWeekKey = (date: Date): string => {
    const weekStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // Initialize the current week and previous 7 weeks.
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    weekDate.setDate(
      weekDate.getDate() - weekDate.getDay() - 7 * i
    );

    weeklyData[getWeekKey(weekDate)] = 0;
  }

  // Count tasks completed in each week.
  tasks.forEach((task) => {
    if (task.status !== 'completed' || !task.completed_at) {
      return;
    }

    const completedDate = new Date(task.completed_at);

    if (Number.isNaN(completedDate.getTime())) {
      return;
    }

    const weekKey = getWeekKey(completedDate);

    if (Object.prototype.hasOwnProperty.call(weeklyData, weekKey)) {
      weeklyData[weekKey] += 1;
    }
  });

  return Object.entries(weeklyData).map(([week, completed]) => {
    const [year, month, day] = week.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return {
      week: `${date.getMonth() + 1}/${date.getDate()}`,
      completed,
    };
  });
}, [tasks]);

  // Action item history - sort by due date (overdue first), then by created_at
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Overdue tasks first
      const aOverdue = a.deadline && a.status !== 'completed' && new Date(a.deadline).getTime() < Date.now();
      const bOverdue = b.deadline && b.status !== 'completed' && new Date(b.deadline).getTime() < Date.now();
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      // Then by due date (earliest first)
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      // Then by created_at (newest first)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [tasks]);

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
        <h2 className="text-xl font-bold mb-2">My Progress</h2>
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

  // Empty state - no mentor connected
  if (!hasMentor) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Progress</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <UsersRound size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Not connected to a mentor yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Connect with a mentor to receive action items and track your progress.
            Once connected, your action items, completion rates, and activity will appear here.
          </p>
          <p className="text-sm text-gray-400">
            Use the "Connect Mentor" option in the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  // Empty state - has mentor but no tasks yet
  if (totalTasks === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Progress</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <CheckCircle2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-lg font-semibold mb-2">No action items yet</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your mentor hasn't assigned any action items yet. They will appear here once created.
          </p>
        </div>
        {reportHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
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
                    <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-2 truncate max-w-xs">{report.title}</td>
                      <td className="p-2">{report.date}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(report.status)}`}>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Progress</h1>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm text-gray-500">Total Action Items</h3>
              <h2 className="text-2xl font-bold mt-1">{totalTasks}</h2>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm text-gray-500">Completed</h3>
              <h2 className="text-2xl font-bold mt-1 text-green-600">{completedTasks}</h2>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm text-gray-500">Pending</h3>
              <h2 className="text-2xl font-bold mt-1 text-yellow-600">{pendingAndInProgress}</h2>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm text-gray-500">Overdue</h3>
              <h2 className="text-2xl font-bold mt-1 text-red-600">{overdueTasks}</h2>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-sm text-gray-500">Completion Rate</h3>
              <h2 className="text-2xl font-bold mt-1 text-primary">{completionRate.toFixed(1)}%</h2>
            </div>
          </div>

          {/* Vertical Bar Chart + Weekly Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Vertical Bar Chart - Progress Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-6">Progress Overview</h3>
              <div className="flex flex-col items-center">
                {chartData.length > 0 ? (
                  <div style={{ width: '100%', height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 25, right: 30, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          formatter={(value) => [Number(value ?? 0), 'tasks']}
                        />

                        <Legend />

                        <Bar
                          dataKey="value"
                          name="Tasks"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                          label={{
                            position: 'top',
                            fontSize: 13,
                            fontWeight: 600,
                            fill: '#1f2937',
                          }}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 w-full">
                    <p className="text-gray-500">No progress data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Completion Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Weekly Completion Activity
              </h3>

              {weeklyActivity.length > 0 && weeklyActivity.some(w => w.completed > 0) ? (
                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={weeklyActivity}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="menteeActivityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4678f7" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#4678f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed Tasks"
                        stroke="#4678f7"
                        strokeWidth={3}
                        fill="url(#menteeActivityGradient)"
                        dot={{ fill: "#4678f7", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No completion activity available yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Report History */}
          {reportHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
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
                      <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-2 truncate max-w-xs">{report.title}</td>
                        <td className="p-2">{report.date}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(report.status)}`}>
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
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-4">Action Item</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Due Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Completed</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => {
                  const isOverdue = task.deadline && task.status !== 'completed' && new Date(task.deadline).getTime() < Date.now();
                  return (
                    <tr key={task.id} className={`border-b border-gray-100 dark:border-gray-800 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <td className="p-4">
                        <div className="font-medium truncate max-w-xs">{task.title}</div>
                        {task.description && <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{task.description}</div>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          task.priority === 'high' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          task.priority === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {task.category || '—'}
                      </td>
                      <td className="p-4">
                        {task.deadline ? (
                          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {new Date(task.deadline).toLocaleDateString()}
                            {isOverdue && <AlertCircle size={12} className="inline ml-1" />}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No due date</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          task.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {task.completed_at ? (
                          <>
                            <CheckCircle2 size={14} className="inline text-green-500 mr-1" />
                            {new Date(task.completed_at).toLocaleDateString()}
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sortedTasks.length === 0 && (
            <div className="p-12 text-center text-gray-500">No action items found</div>
          )}
        </div>
      )}
    </div>
  );
};