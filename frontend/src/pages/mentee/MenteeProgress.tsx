import React from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import {
  AlertCircle,
  CheckCircle2,
  UsersRound,
} from 'lucide-react';

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
  description?: string | null;
  status: string;
  deadline?: string | null;
  priority?: string;
  category?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
}


const getStatusClass = (status: string): string => {
  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    shared: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const ProgressError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
    <h2 className="text-xl font-bold mb-2">My Progress</h2>
    <p className="text-red-500">Error: {message}</p>
  </div>
);

export const MenteeProgress: React.FC = () => {
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

  // Fetch mentee tasks (mentee endpoint)
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
    const weeklyData: Record<string, { completed: number; total: number }> = {};
    const now = new Date();

    // Initialize last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData[weekKey] = { completed: 0, total: 0 };
    }

    tasks.forEach(task => {
      if (task.completed_at) {
        const completedDate = new Date(task.completed_at);
        const weekStart = new Date(completedDate);
        weekStart.setDate(completedDate.getDate() - completedDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (weeklyData.hasOwnProperty(weekKey)) {
          weeklyData[weekKey].completed += 1;
        }
      }
      // Count all tasks created in the week
      if (task.created_at) {
        const createdDate = new Date(task.created_at);
        const weekStart = new Date(createdDate);
        weekStart.setDate(createdDate.getDate() - createdDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (weeklyData.hasOwnProperty(weekKey)) {
          weeklyData[weekKey].total += 1;
        }
      }
    });

    return Object.entries(weeklyData)
      .map(([week, data]) => {
        const date = new Date(week);
        return {
          week: `${date.getMonth() + 1}/${date.getDate()}`,
          completed: data.completed,
        };
      })
      .slice(-8);
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
      <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
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

          {/* Circular Progress Chart + Weekly Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Circular Donut Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-6">Progress Overview</h3>
              <div className="flex flex-col items-center">
                {chartData.length > 0 ? (
                  <div style={{ width: '280px', height: '280px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                          labelLine={false}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [Number(value ?? 0), 'tasks']}
                        />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <div className="text-4xl font-bold" style={{ color: '#1f2937', lineHeight: 1 }}>
                        {completionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {totalTasks} total
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No progress data available</p>
                  </div>
                )}
                <div className="flex gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Completion Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Completion Activity</h3>
              {weeklyActivity.length > 0 && weeklyActivity.some(w => w.completed > 0) ? (
                <div className="space-y-3">
                  {weeklyActivity.map((week) => (
                    <div key={week.week} className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-20">{week.week}</span>
                      <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                        {week.completed > 0 && (
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((week.completed / Math.max(week.completed, 1)) * 100, 100)}%` }}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium text-green-600 w-12 text-right">
                        {week.completed}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No completed tasks this period</p>
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
