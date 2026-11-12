import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Table,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@/components/ui/table';

interface MenteeReport {
  id: number;
  meeting_title: string;
  mentor_full_name?: string | null;
  mentor_email?: string | null;
  status: string;
  meeting_date: string;
}

export const MenteeReports: FC = () => {
  const token = localStorage.getItem('token');

  // Fetch mentee reports
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MenteeReport[]>({
    queryKey: ['mentee-reports'],
    queryFn: async () => {
      const response = await api.get('/reports/mentee', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  // Download PDF
  const downloadPdf = async (reportId: number) => {
    try {
      const response = await api.post(
        `/reports/${reportId}/download-pdf`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('PDF download failed:', downloadError);
    }
  };

  // Download DOCX
  const downloadDocx = async (reportId: number) => {
    try {
      const response = await api.post(
        `/reports/${reportId}/download-docx`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `report-${reportId}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('DOCX download failed:', downloadError);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">
          My Reports
        </h2>

        <p>Loading reports...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">
          My Reports
        </h2>

        <p className="text-red-500">
          Error: {errorMessage}
        </p>

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
      <h1 className="text-2xl font-bold">
        My Reports
      </h1>

      {/* Reports Table */}
      {reports.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Mentor</TableCell>
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
                      {report.mentor_full_name ||
                        report.mentor_email ||
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
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:border-gray-600'
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
                      {report.status === 'approved' && (
                        <>
                          <button
                            onClick={() =>
                              downloadPdf(report.id)
                            }
                            className="px-2 py-1 rounded text-xs text-green-600 hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                          >
                            PDF
                          </button>

                          <button
                            onClick={() =>
                              downloadDocx(report.id)
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

      {/* Empty State */}
      {reports.length === 0 && (
        <p className="text-sm text-gray-500 no-reports-message">
          No approved or shared reports found.
        </p>
      )}
    </div>
  );
};