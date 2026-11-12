import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
  Mic2, FileUp, AudioLines, SlidersHorizontal, ChevronDown,
  Settings2, Clock3, ListChecks, RefreshCw
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

const STATUS_COLORS: Record<string, string> = {
  Ready: 'pill-ready',
  Draft: 'pill-draft',
  Processing: 'pill-processing',
  Recorded: 'pill-neutral',
};

export const MentorMeetings: React.FC = () => {
  const [search] = useState('');
  const [isRecording, setIsRecording] = useState(false);

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

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.success('Recording started', { description: 'Men.AI is now capturing the session.' });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.success('Session saved', { description: 'Your transcript is ready for AI processing.' });
    refetch();
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
              {isRecording && <span className="session-timer">00:14</span>}
            </div>
            <div className="soundwave mirrored">
              {[...Array(15)].map((_, i) => <i key={i} style={{ animationDelay: `${i * 50}ms` }} />)}
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
            <label>Topic<input placeholder="e.g. Portfolio review" defaultValue="Weekly mentorship sync" /></label>
            <label>
              Mentee
              <select defaultValue="Aarav">
                <option value="Aarav">Aarav Mehta</option>
                <option value="Maya">Maya Chen</option>
                <option value="Noah">Noah Williams</option>
              </select>
            </label>
            <label>
              Session goal
              <textarea placeholder="What would make this conversation useful?" defaultValue="Align on the first research sprint and unblock next steps." />
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