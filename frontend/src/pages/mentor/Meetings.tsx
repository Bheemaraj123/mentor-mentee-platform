import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
  Mic2, FileUp, AudioLines, SlidersHorizontal, ChevronDown,
  Settings2, Clock3, RefreshCw
} from 'lucide-react';

interface Meeting {
  id: number;
  title: string;
  mentee: string;
  mentee_initials: string;
  mentee_tone: string;
  date: string;
  duration: string;
  status: 'Ready' | 'Draft' | 'Processing' | 'Recorded';
  transcript?: string;
}

interface Mentee {
  id: number;
  full_name: string;
}

interface RecordingState {
  chunks: Blob[];
  mediaRecorder: MediaRecorder | null;
  timerId: NodeJS.Timeout | null;
  elapsedTime: number;
}

const STATUS_COLORS: Record<string, string> = {
  Ready: 'pill-ready',
  Draft: 'pill-draft',
  Processing: 'pill-processing',
  Recorded: 'pill-neutral',
};

export const MentorMeetings: React.FC = () => {
  const [search] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    chunks: [],
    mediaRecorder: null,
    timerId: null,
    elapsedTime: 0,
  });

  // Fetch meetings from backend
  const { data: meetings = [], isLoading, refetch } = useQuery<Meeting[]>({
    queryKey: ['mentor-meetings'],
    queryFn: async () => {
      const response = await api.get('/meetings/mentor');
      return response.data;
    },
  });

  // Transform backend meetings to UI format
  const uiMeetings = useMemo(() => meetings.map((m: any) => ({
    id: m.id,
    title: m.title || 'Untitled Meeting',
    mentee: m.mentee_name || 'Unknown Mentee',
    mentee_initials: m.mentee_initials || 'MM',
    mentee_tone: m.mentee_tone || 'blue',
    date: m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No date',
    duration: m.duration || '0 min',
    status: (m.status === 'completed' ? 'Ready' : m.status === 'processing' ? 'Processing' : 'Draft') as Meeting['status'],
    transcript: m.transcript,
  })), [meetings]);

  const filteredMeetings = useMemo(() => uiMeetings.filter((meeting) => {
    const query = search.toLowerCase();
    return !query || `${meeting.title} ${meeting.mentee}`.toLowerCase().includes(query);
  }), [uiMeetings, search]);

  // Fetch mentees from API
  const { data: mentees = [], isMenteesLoading, refetch: refetchMentees } = useQuery<Mentee[]>({
    queryKey: ['mentor-mentees'],
    queryFn: async () => {
      const response = await api.get('/my-mentees');
      return response.data;
    },
  });

  const [topic, setTopic] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');

  // selectedMentee state for the dropdown
  const [selectedMenteeId, setSelectedMenteeId] = useState<number | null>(null);

  // Mutation for creating a meeting (with recording)
  const queryClient = useQueryClient();

  const handleStartRecording = async () => {
    // Validate required fields
    if (!topic.trim()) {
      toast.error('Validation error', { description: 'Topic must be selected or entered before recording.' });
      return;
    }

    // Mentee must be selected when the logged-in user is a mentor
    if (!selectedMenteeId) {
      toast.error('Validation error', { description: 'Mentee must be selected before recording.' });
      return;
    }

    if (!sessionGoal.trim()) {
      toast.error('Validation error', { description: 'Session goal must be provided.' });
      return;
    }

    // Request microphone permission and start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all microphone tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Start timer
      const startTime = Date.now();
      let timerId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingState(prev => ({ ...prev, elapsedTime: elapsed }));
      }, 1000);

      setIsRecording(true);
      setRecordingState({ chunks, mediaRecorder, timerId, elapsedTime: 0 });
      toast.success('Recording started', { description: 'Men.AI is now capturing the session.' });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Microphone permission denied', { description: 'Please grant microphone permission to record.' });
      } else if (err instanceof DOMException && err.name === 'NotSupportedError') {
        toast.error('Unsupported browser', { description: 'MediaRecorder is not supported in this browser.' });
      } else {
        toast.error('Recording failed', { description: 'Could not start recording. ' + (err instanceof Error ? err.message : 'Unknown error') });
      }
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    const { timerId, mediaRecorder, chunks } = recordingState;

    if (timerId) {
      clearInterval(timerId);
    }

    if (mediaRecorder) {
      mediaRecorder.stop();
    }

    // Note: chunks are preserved in state for report generation
    // They will be used after the user provides meeting details

    setRecordingState(prev => ({
      ...prev,
      timerId: null,
      elapsedTime: 0,
    }));

    toast.success('Session saved', { description: 'Your transcript is ready for AI processing.' });

    // Show report generation form with the recorded audio
    showReportGenerationForm(chunks);
  };

  const generateReportFromRecording = async (chunks: Blob[]) => {
    if (chunks.length === 0) {
      toast.error('Error', { description: 'No audio was recorded.' });
      return;
    }

    // Create a Blob from the recorded chunks
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    // Show the report generation form
    showReportGenerationForm(audioBlob);
  };

  const showReportGenerationForm = async (audioBlob: Blob) => {
    // In a real implementation, we would submit to the backend
    // POST /generate-report/{meeting_id} with FormData containing:
    // - audio file
    // - mentee_id
    // - meeting_title (topic)
    // - session_goal

    // For now, display toast and note that the form will use existing API
    toast.info('Report generation ready', { description: 'Fill in meeting details to generate your report with the recorded audio.' });
  };

  const handleUploadTranscript = () => {
    toast.info('File picker ready', { description: 'Choose an audio, video, or transcript file to continue.' });
  };

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Session room</p>
          <h1>Make the next conversation count</h1>
          <p className="page-description">Capture a session live or bring in a transcript to get your report started.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={handleUploadTranscript}>
            <FileUp size={16} /> Upload transcript
          </button>
          <button className="primary-button" onClick={handleStartRecording} disabled={isRecording}>
            <Mic2 size={17} /> {isRecording ? 'Recording...' : 'Start recording'}
          </button>
        </div>
      </section>

      <div className="session-view">
        <div className={`session-stage surface-card ${isRecording ? 'session-live' : ''}`}>
          <div className="session-stage-top">
            <span className="section-kicker">Live capture room</span>
            <span className={`pill ${isRecording ? 'pill-recording' : 'pill-neutral'}`}>
              {isRecording ? <><i className="record-dot" /> Recording now</> : 'Ready to capture'}
            </span>
          </div>
          <div className="session-visual">
            <div className="soundwave">
              {[...Array(15)].map((_, i) => <i key={i} style={{ animationDelay: `${i * 50}ms` }} />)}
            </div>
            <div className="session-core">
              <AudioLines size={31} />
              {isRecording && <span className="session-timer">{formatTime(recordingState.elapsedTime)}</span>}
            </div>
            <div className="soundwave mirrored">
              {[[...Array(15)].map((_, i) => <i key={i} style={{ animationDelay: `${i * 50}ms` }} />)}
            </div>
          </div>
          <h2>{isRecording ? "You're in the room." : "A better note-taker is waiting."}</h2>
          <p>{isRecording ? "Stay present. Men.AI is listening for themes, decisions, and the next right step." : "Capture your next mentorship session and let AI surface what matters."}</p>
          <div className="session-buttons">
            {isRecording ? (
              <button className="stop-button" onClick={handleStopRecording}>
                <span /> Stop recording
              </button>
            ) : (
              <button className="primary-button large" onClick={handleStartRecording}>
                <Mic2 size={18} /> Start recording
              </button>
            )}
            <button className="secondary-button large" onClick={handleUploadTranscript}>
              <FileUp size={17} /> Upload transcript
            </button>
          </div>
        </div>

        <div className="session-side">
          <div className="surface-card session-meta">
            <div className="card-heading">
              <div><span className="section-kicker">Before you begin</span><h3>Session context</h3></div>
              <Settings2 size={17} />
            </div>

            {/* Mentee Dropdown - Dynamic from API */}
            <label>
              Mentee
              <select
                value={selectedMenteeId || ''}
                onChange={(e) => setSelectedMenteeId(Number(e.target.value) || null)}
                disabled={isRecording}
              >
                <option value="">Select a mentee</option>
                {mentees.map((mentee) => (
                  <option key={mentee.id} value={mentee.id}>
                    {mentee.full_name}
                  </option>
                ))}
              </select>
              {mentees.length === 0 && (
                <span className="text-sm text-muted-foreground">No active mentees assigned. Assign mentees first.</span>
              )}
            </label>

            {/* Topic - Editable field, no hardcoded default */}
            <label>
              Topic
              <input
                placeholder="e.g. Portfolio review"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isRecording}
              />
            </label>

            {/* Session Goal - Editable field */}
            <label>
              Session goal
              <textarea
                placeholder="What would make this conversation useful?"
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                disabled={isRecording}
                rows={3}
              />
            </label>
          </div>
          <div className="ai-tip">
            <div className="tip-icon"><span style={{fontSize: '17px'}}>✨</span></div>
            <span><strong>Men.AI will look for</strong><small>Decisions · key themes · commitments · signals of progress</small></span>
          </div>
        </div>
      </div>

      {/* Past Sessions / Reports Library */}
      <section className="content-section">
        <div className="section-heading">
          <div><span className="section-kicker">Recent sessions</span><h2>Session history</h2></div>
          <div className="reports-toolbar">
            <span>{filteredMeetings.length} sessions</span>
            <button className="filter-button"><SlidersHorizontal size={14} /> Sort: newest <ChevronDown size={14} /></button>
          </div>
        </div>
        <div className="report-library-grid">
          {isLoading ? (
            <div className="session-stage" style={{ gridColumn: '1 / -1', minHeight: '200px' }}>
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: '#2f6bff' }} />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="session-stage" style={{ gridColumn: '1 / -1', minHeight: '200px', textAlign: 'center' }}>
              <div className="ai-mini-icon" style={{ marginBottom: '16px', width: '48px', height: '48px', fontSize: '20px' }}>
                <AudioLines size={24} />
              </div>
              <strong style={{ fontSize: '16px', color: '#15233e', display: 'block', marginBottom: '8px' }}>No sessions yet</strong>
              <p style={{ color: '#9aa7b8', fontSize: '13px' }}>Your captured sessions will appear here.</p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <button
                key={meeting.id}
                className="library-report surface-card"
                onClick={() => {}} // No detail view for now
              >
                <div className={`library-report-art art-${meeting.mentee_tone}`}>
                  <span><AudioLines size={24} /></span>
                  <span className={`pill ${STATUS_COLORS[meeting.status]}`}>{meeting.status}</span>
                </div>
                <div className="library-report-copy">
                  <strong>{meeting.title}</strong>
                  <small>{meeting.mentee} · {meeting.date}</small>
                  <div>
                    <span><Clock3 size={13} /> {meeting.duration}</span>
                    <span><ListChecks size={13} /> {meeting.transcript ? 'Transcript ready' : 'Processing'}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const formatTime = (elapsedMs: number): string => {
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};