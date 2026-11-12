import type { FC } from 'react';
import { Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Table,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@/components/ui/table';

interface ReportActionItem {
  task: string;
  description?: string | null;
  deadline?: string | null;
  responsible?: string | null;
}

interface MentorReport {
  id: number;
  meeting_title: string;
  mentee_full_name?: string | null;
  mentee_email?: string | null;
  status: string;
  meeting_date: string;
  report_content?: {
    action_items?: ReportActionItem[] | null;
  } | null;
}

interface CreateTaskVariables {
  reportId: number;
  actionItem: string;
  description: string;
  deadline: string;
  responsible: string;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const MentorReports: FC = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch reports
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MentorReport[]>({
    queryKey: ['mentor-reports'],
    queryFn: async () => {
      const response = await api.get('/reports', authConfig);
      return response.data;
    },
  });

  // Create task from report action items
  const createTaskMutation = useMutation({
    mutationKey: ['create-task-from-report'],
    mutationFn: async (variables: CreateTaskVariables) => {
      const response = await api.post(
        '/tasks/',
        {
          title: variables.actionItem,
          description: variables.description,
          deadline: variables.deadline || null,
          priority: 'medium',
          report_id: variables.reportId,
        },
        authConfig
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['mentor-reports'],
      });

      queryClient.invalidateQueries({
        queryKey: ['mentor-tasks-progress'],
      });

      queryClient.invalidateQueries({
        queryKey: ['mentee-tasks'],
      });
    },
  });

  // Approve report
  const approveMutation = useMutation({
    mutationKey: ['approve-report'],
    mutationFn: async (reportId: number) => {
      const response = await api.post(
        `/reports/${reportId}/approve`,
        {},
        authConfig
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['mentor-reports'],
      });
    },
  });

  // Share report
  const shareMutation = useMutation({
    mutationKey: ['share-report'],
    mutationFn: async (reportId: number) => {
      const response = await api.post(
        `/reports/${reportId}/share`,
        {},
        authConfig
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['mentor-reports'],
      });
    },
  });

  // Download report file
  const downloadReport = async (
    reportId: number,
    format: 'pdf' | 'docx'
  ) => {
    try {
      const response = await api.post(
        `/reports/${reportId}/download-${format}`,
        {},
        {
          ...authConfig,
          responseType: 'blob',
        }
      );

      const mimeType =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const blob = new Blob([response.data], {
        type: mimeType,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `report-${reportId}.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(`${format.toUpperCase()} download failed:`, downloadError);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Mentor Reports</h2>
        <p>Loading reports...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">Mentor Reports</h2>
        <p className="text-red-500">Error: {getErrorMessage(error)}</p>

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
      <h1 className="text-2xl font-bold">Reports Management</h1>

      {/* Reports Table */}
      {reports.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Mentee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="truncate max-w-xs">
                      {report.meeting_title}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      {report.mentee_full_name ||
                        report.mentee_email ||
                        '—'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-800'
                          : report.status === 'shared'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:border-blue-800'
                          : report.status === 'draft'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:border-gray-600'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800'
                      }`}
                    >
                      {report.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    {report.meeting_date
                      ? new Date(
                          report.meeting_date
                        ).toLocaleDateString()
                      : '—'}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      {report.status === 'draft' && (
                        <>
                          <button
                            disabled={approveMutation.isPending}
                            onClick={() =>
                              approveMutation.mutate(report.id)
                            }
                            className="px-2 py-1 rounded text-xs text-green-600 hover:bg-green-100 dark:hover:bg-green-800 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            disabled={shareMutation.isPending}
                            onClick={() =>
                              shareMutation.mutate(report.id)
                            }
                            className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                          >
                            Share
                          </button>
                        </>
                      )}

                      {report.status === 'approved' && (
                        <>
                          <button
                            onClick={() =>
                              downloadReport(report.id, 'pdf')
                            }
                            className="px-2 py-1 rounded text-xs text-green-600 hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                          >
                            PDF
                          </button>

                          <button
                            onClick={() =>
                              downloadReport(report.id, 'docx')
                            }
                            className="px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                          >
                            DOCX
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {reports.length === 0 && (
        <p className="text-sm text-gray-500 no-reports-message">
          No reports found.
        </p>
      )}

      {/* Create Task from Report Action Items */}
      {reports.length > 0 && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium mb-3">
            Create Task from Report Action Items
          </h3>

          {reports.map((report) => {
            const actionItems = report.report_content?.action_items || [];

            if (actionItems.length === 0) {
              return null;
            }

            return (
              <Fragment key={report.id}>
                <p className="text-sm text-gray-500 mb-1">
                  Report: {report.meeting_title} -{' '}
                  {report.mentee_full_name || 'Mentee'}
                </p>

                <div className="space-y-1 mb-4">
                  {actionItems.map((item, index) => (
                    <div
                      key={`${report.id}-${index}`}
                      className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-medium">{item.task}</div>

                      <div className="text-xs text-gray-500">
                        {item.description || 'No description'}
                      </div>

                      <button
                        disabled={createTaskMutation.isPending}
                        onClick={() =>
                          createTaskMutation.mutate({
                            reportId: report.id,
                            actionItem: item.task,
                            description: item.description || '',
                            deadline: item.deadline || '',
                            responsible: item.responsible || '',
                          })
                        }
                        className="text-xs text-primary hover:text-primary/90 transition-colors disabled:opacity-50"
                      >
                        {createTaskMutation.isPending
                          ? 'Creating...'
                          : 'Create Task'}
                      </button>
                    </div>
                  ))}
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};