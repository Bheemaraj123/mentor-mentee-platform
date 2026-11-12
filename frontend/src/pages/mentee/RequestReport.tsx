import React, { useState } from 'react';
import { FileQuestion, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Mentor {
  id: number;
  full_name: string;
  email: string;
}

export const RequestReport: React.FC = () => {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch assigned mentor
  React.useEffect(() => {
    fetchMentor();
  }, []);

  const fetchMentor = async () => {
    try {
      const response = await api.get('/assignments/my-mentor');
      if (response.data) {
        setMentor(response.data);
      }
    } catch (err) {
      // Not connected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!mentor) {
      setError('You are not connected to a mentor. Please connect with a mentor first.');
      return;
    }

    if (!meetingTitle) {
      setError('Please enter a meeting title');
      return;
    }

    if (!meetingDate) {
      setError('Please select a meeting date');
      return;
    }

    setLoading(true);
    try {
      await api.post('/report-requests', {
        mentor_id: mentor.id,
        meeting_title: meetingTitle,
        meeting_date: meetingDate,
        description: description || undefined
      });

      setSuccess('Report request submitted successfully! Your mentor will review it.');
      setMeetingTitle('');
      setMeetingDate('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit report request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Report</h1>
        <p className="text-gray-500 text-sm">Request your mentor to generate a report for a specific meeting.</p>
      </div>

      {mentor ? (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase tracking-wider">
              Assigned Mentor
            </span>
            <h3 className="text-lg font-bold mt-1">{mentor.full_name}</h3>
            <p className="text-sm text-gray-500">{mentor.email}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-4 text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <span className="font-semibold">Not connected to a mentor</span>
            <p className="text-sm mt-1">Please connect with a mentor first before requesting a report.</p>
          </div>
        </div>
      )}

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meeting Title *</label>
            <input
              type="text"
              placeholder="e.g. Weekly Progress Review - Milestone 2"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meeting Date *</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Briefly describe what you'd like to discuss in the meeting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !mentor}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <FileQuestion className="w-5 h-5" />
                Submit Report Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};