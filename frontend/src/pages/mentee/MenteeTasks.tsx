import type { FC, ChangeEvent } from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, FileText, Upload, X, AlertTriangle } from 'lucide-react';

interface MenteeTask {
  id: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority: string;
  status: string;
  require_file_upload?: boolean;
  completion_description?: string | null;
  uploaded_file_name?: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  related_meeting?: string | null;
  category?: string | null;
  notes?: string | null;
}

interface ActionDetailsModalProps {
  close: () => void;
  task: MenteeTask;
  onComplete: () => void;
}

function ActionDetailsModal({ close, task, onComplete }: ActionDetailsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionDescription, setCompletionDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check deadline on frontend
    if (task.deadline && new Date(task.deadline) < new Date()) {
      setError("Cannot upload file after deadline has passed");
      return;
    }

    // Check if already completed
    if (task.status === "completed") {
      setError("Task is already completed");
      return;
    }

    // Validate file type
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.mkv', '.txt', '.pdf', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      setError("File type not allowed");
      return;
    }

    // Check file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      await api.post(`/tasks/mentee/${task.id}/complete-with-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Task completed successfully with file upload!");
      setIsUploading(false);
      onComplete();
    } catch (err: any) {
      setIsUploading(false);
      const detail = err.response?.data?.detail || err.message || "Failed to upload file";
      setError(detail);
    }
  };

  const handleDescriptionComplete = async () => {
    if (!completionDescription.trim()) {
      setError("Completion description is required");
      return;
    }

    // Check deadline on frontend
    if (task.deadline && new Date(task.deadline) < new Date()) {
      setError("Cannot complete task after deadline has passed");
      return;
    }

    // Check if already completed
    if (task.status === "completed") {
      setError("Task is already completed");
      return;
    }

    // Check if file upload is required
    if (task.require_file_upload) {
      setError("This task requires file upload completion");
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await api.post(`/tasks/mentee/${task.id}/complete-with-description`,
        { completion_description: completionDescription.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Task completed successfully!");
      setIsCompleting(false);
      onComplete();
    } catch (err: any) {
      setIsCompleting(false);
      const detail = err.response?.data?.detail || err.message || "Failed to complete task";
      setError(detail);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const requireFileUpload = task.require_file_upload;
  const isCompleted = task.status === "completed";
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Action Item Details</h2>
          <button onClick={close} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                {task.title}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[80px] whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Additional Notes</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[60px] whitespace-pre-wrap">
                {task.notes || 'No additional notes'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  {task.assigned_to || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Related Meeting</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  {task.related_meeting || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium inline-block',
                  task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:border-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:border-blue-800'
                )}>
                  {task.priority}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium inline-block',
                  task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-800' :
                  task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:border-gray-600'
                )}>
                  {task.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                  {formatDate(task.deadline)}
                  {isOverdue && <span className="text-red-600 font-semibold text-sm">(OVERDUE)</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  {task.category || 'General'}
                </div>
              </div>
            </div>

            {task.completion_description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completion Description</label>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 min-h-[60px] whitespace-pre-wrap">
                  {task.completion_description}
                </div>
              </div>
            )}

            {task.uploaded_file_name && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Uploaded File</label>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-3">
                  <FileText size={24} className="text-green-600" />
                  <span>{task.uploaded_file_name}</span>
                </div>
              </div>
            )}

            {task.completed_at && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed At</label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  {formatDateTime(task.completed_at)}
                </div>
              </div>
            )}
          </div>

          {/* Completion Interface */}
          {!isCompleted && !isOverdue && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Complete This Action</h3>

              {requireFileUpload ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    This action requires a file upload to complete. Please select a file below.
                  </p>
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.txt,.pdf,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id={`file-upload-${task.id}`}
                  />
                  <label
                    htmlFor={`file-upload-${task.id}`}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium",
                      "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200",
                      "hover:bg-gray-50 dark:hover:bg-gray-600",
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Upload size={16} />
                    {isUploading ? 'Uploading...' : 'Choose File & Complete'}
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block mb-3">
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Completion Description (Required)</span>
                    <textarea
                      value={completionDescription}
                      onChange={(e) => setCompletionDescription(e.target.value)}
                      placeholder="Describe what you completed and any outcomes..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      disabled={isCompleting}
                    />
                  </label>
                  <button
                    onClick={handleDescriptionComplete}
                    disabled={isCompleting || !completionDescription.trim()}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg text-sm font-medium text-white",
                      "bg-blue-600 hover:bg-blue-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isCompleting ? 'Completing...' : 'Mark as Completed'}
                  </button>
                </div>
              )}
            </div>
          )}

          {(isCompleted || isOverdue) && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              {isCompleted ? (
                <>
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>Task is completed</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-red-600" />
                  <span>Task is overdue and cannot be completed</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={close}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export const MenteeTasks: FC = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const [selectedTaskForView, setSelectedTaskForView] = useState<MenteeTask | null>(null);

  // Fetch assigned tasks
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MenteeTask[]>({
    queryKey: ['mentee-tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/mentee', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">My Tasks</h2>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-bold mb-2">My Tasks</h2>
        <p className="text-red-500">Error: {errorMessage}</p>

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
      <h1 className="text-2xl font-bold">My Tasks</h1>

      {/* Tasks List */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-lg border transition-colors cursor-pointer',
                task.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : task.status === 'overdue'
                  ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              )}
              onClick={() => setSelectedTaskForView(task)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4
                    className={cn(
                      'font-semibold',
                      task.status === 'completed'
                        ? 'text-green-900 dark:text-green-100'
                        : task.status === 'overdue'
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {task.title}
                  </h4>

                  <p className="text-sm text-gray-500 truncate line-clamp-1">
                    {task.description || 'No description'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:border-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:border-blue-800'
                    )}
                  >
                    {task.priority}
                  </span>

                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-800'
                        : task.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:border-gray-600'
                    )}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Due:{' '}
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString()
                  : 'No deadline'}
              </div>

              <div className="mt-2 flex gap-1">
                {task.status === 'completed' ? (
                  <span className="px-2 py-1 rounded text-xs text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-100">
                    Completed
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
                    Click to view details & complete
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="text-sm text-gray-500 no-tasks-message">
          No tasks assigned yet.
        </p>
      )}

      {selectedTaskForView && (
        <ActionDetailsModal
          close={() => setSelectedTaskForView(null)}
          task={selectedTaskForView}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['mentee-tasks'] });
            setSelectedTaskForView(null);
          }}
        />
      )}
    </div>
  );
};