import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface Mentee {
  id: number;
  full_name: string;
  email: string;
  assigned_at: string;
}

export const MeetingInput: React.FC = () => {
  const navigate = useNavigate();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [menteeId, setMenteeId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const [uploading, setUploading] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMentees = async () => {
    try {
      const response = await api.get('/meetings/my-mentees');
      setMentees(response.data);
      if (response.data.length > 0) {
        setMenteeId(String(response.data[0].id));
      }
    } catch (err) {
      // Silently fail - user might not have mentees yet
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUploadAndProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!menteeId) {
      setError('Please select a mentee');
      return;
    }
    if (!title) {
      setError('Please enter a meeting title');
      return;
    }
    if (!date) {
      setError('Please select a meeting date');
      return;
    }
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);

    // Prepare FormData
    const formData = new FormData();
    formData.append('mentee_id', menteeId);
    formData.append('meeting_title', title);
    formData.append('meeting_date', date);
    if (description) {
      formData.append('description', description);
    }
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/meetings/create-meeting', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploading(false);
      setMeetingId(response.data.meeting_id);
      setExtractedPreview(response.data.extracted_text_preview);
      setSuccess('Files successfully uploaded and processed. Review the extracted content below, then generate the report.');
    } catch (err: any) {
      setUploading(false);
      setError(err.response?.data?.detail || 'Failed to upload and process files');
    }
  };

  const handleGenerateReport = async () => {
    if (!meetingId) return;

    setGeneratingReport(true);
    setError(null);

    try {
      const response = await api.post(`/meetings/generate-report/${meetingId}`);
      setGeneratingReport(false);
      // Navigate to report details page
      navigate(`/mentor/reports/${response.data.report_id}`);
    } catch (err: any) {
      setGeneratingReport(false);
      setError(err.response?.data?.detail || 'Failed to generate report');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Unified Meeting Input</h1>
        <p className="text-gray-500 text-sm">Upload audio, video, transcripts, or documents to generate structured AI reports.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <form onSubmit={handleUploadAndProcess} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Mentee *</label>
              <select
                value={menteeId}
                onChange={(e) => setMenteeId(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                {mentees.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meeting Title *</label>
            <input
              type="text"
              placeholder="e.g. Weekly Progress Review - Milestone 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Briefly describe the meeting agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Files (Audio, Video, TXT, PDF, DOCX) *</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.txt,.pdf,.docx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-500 mt-1">MP3, WAV, M4A, MP4, MOV, MKV, TXT, PDF, DOCX (Max 50MB each)</span>
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      {file.name}
                    </span>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}
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
            disabled={uploading || generatingReport}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing & Extracting Content...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Process Uploaded Content
              </>
            )}
          </button>
        </form>

        {extractedPreview && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Extracted Content Preview
            </h3>
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700 max-h-96">
              {extractedPreview}
            </pre>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Structured AI Report...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Structured Report
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};