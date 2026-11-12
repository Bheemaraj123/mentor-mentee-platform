import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Mentee {
  id: number;
  full_name: string;
  email: string;
  assigned_at: string;
}

export const MenteeManagement: React.FC = () => {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMentees = async () => {
    try {
      const response = await api.get('/assignments/my-mentees');
      setMentees(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch mentees');
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    setError(null);
    try {
      const response = await api.post('/assignments/generate-code', {
        max_uses: 10,
        expires_in_days: 7
      });
      setInvitationCode(response.data.code);
      setCopied(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate invitation code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopy = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const filteredMentees = mentees.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mentee Management</h1>
          <p className="text-gray-500 text-sm">Manage your assigned mentees and invitation codes</p>
        </div>
        <button
          onClick={handleGenerateCode}
          disabled={generatingCode}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingCode ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Generate Invitation Code
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {invitationCode && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Active Invitation Code
            </p>
            <p className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100 mt-1">
              {invitationCode}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Share this code with your mentee. Expires in 7 days.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Assigned Mentees ({filteredMentees.length})</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search mentees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        {filteredMentees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>No mentees assigned yet.</p>
            <p className="text-xs mt-1">Generate an invitation code and share it with your mentees.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {filteredMentees.map((mentee) => (
                  <tr key={mentee.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="py-3 px-4 font-medium">{mentee.full_name}</td>
                    <td className="py-3 px-4 text-gray-500">{mentee.email}</td>
                    <td className="py-3 px-4 text-gray-500">{mentee.assigned_at.split('T')[0]}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-primary font-medium text-xs hover:underline">
                        View Profile
                      </button>
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