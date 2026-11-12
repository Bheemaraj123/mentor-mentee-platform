import React, { useState, useEffect } from 'react';
import { FileQuestion, CheckCircle, XCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';

interface ReportRequest {
  id: number;
  mentee_id: number;
  mentor_id: number;
  meeting_title: string;
  meeting_date: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const ReportRequests: React.FC = () => {
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/report-requests');
      setRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch report requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: number, action: 'accept' | 'reject') => {
    setProcessingId(requestId);
    setError(null);

    let rejectionReason: string | undefined;
    if (action === 'reject') {
      rejectionReason = prompt('Please provide a rejection reason (optional):') || undefined;
    }

    try {
      const response = await api.post(`/report-requests/${requestId}/action`, {
        action,
        rejection_reason: rejectionReason
      });

      setRequests(requests.map(req =>
        req.id === requestId ? response.data : req
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileQuestion className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Report Requests</h1>
          <p className="text-gray-500 text-sm">Review and manage report requests from your mentees</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileQuestion className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>No report requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-4">Meeting Title</th>
                  <th className="py-3 px-4">Mentee ID</th>
                  <th className="py-3 px-4">Meeting Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="py-3 px-4 font-medium">{request.meeting_title}</td>
                    <td className="py-3 px-4 text-gray-500">#{request.mentee_id}</td>
                    <td className="py-3 px-4 text-gray-500">{request.meeting_date.split('T')[0]}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{request.created_at.split('T')[0]}</td>
                    <td className="py-3 px-4 text-right">
                      {request.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(request.id, 'accept')}
                            disabled={processingId === request.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={processingId === request.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};