import React, { useState } from 'react';
import { UserCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface Mentor {
  id: number;
  full_name: string;
  email: string;
}

export const ConnectMentor: React.FC = () => {
  const [code, setCode] = useState('');
  const [assignedMentor] = useState<Mentor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already connected on mount
  React.useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Try to get mentee's assigned mentor - we'll need an endpoint for this
      // For now, we'll check via the assignments API
    } catch (err) {
      // Not connected
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!code.trim()) {
      setError('Please enter a valid invitation code.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/assignments/join', { code: code.trim() });
      setSuccess('Successfully connected with your mentor!');
      setCode('');

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/mentee/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect with mentor. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connect with Mentor</h1>
        <p className="text-gray-500 text-sm">Enter the invitation code provided by your mentor to link accounts.</p>
      </div>

      {assignedMentor ? (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 rounded-full">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Currently Assigned
              </span>
              <h3 className="text-xl font-bold mt-1">{assignedMentor.full_name}</h3>
              <p className="text-sm text-gray-500">{assignedMentor.email}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Invitation Code</label>
              <input
                type="text"
                placeholder="e.g. A3F8B2C1"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono tracking-wider text-lg"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-green-500 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  Connect to Mentor
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};