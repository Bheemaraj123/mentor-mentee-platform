import {
  Archive,
  ArrowUpRight,
  AudioLines,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  Download,
  Edit3,
  FileText,
  FileUp,
  Flag,
  Info,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Mic2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UploadCloud,
  UsersRound,
  User,
  WandSparkles,
  X,
  Zap,
  AlertCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ShareOptions } from "@/components/ShareOptions";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { MenteeProgress } from "@/pages/mentor/MentorProgress";

type ViewKey = "overview" | "reports" | "sessions" | "actions" | "people" | "analytics" | "ai-assistant" | "help";

const navCopy: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Tuesday, November 10, 2026",
    title: "Good morning",
    description: "Here's the pulse of your mentorship practice.",
  },
  reports: {
    eyebrow: "Report library",
    title: "Your conversations, made useful",
    description: "Review, refine, and share every report from one calm workspace.",
  },
  sessions: {
    eyebrow: "Session room",
    title: "Make the next conversation count",
    description: "Capture a session live or bring in a transcript to get your report started.",
  },
  actions: {
    eyebrow: "Shared accountability",
    title: "Keep momentum visible",
    description: "Turn conversation into clear owners, dates, and next steps.",
  },
  people: {
    eyebrow: "Mentor network",
    title: "People behind the progress",
    description: "See relationship context, goals, and recent movement across your mentees.",
  },
  analytics: {
    eyebrow: "Performance insights",
    title: "Data behind the growth",
    description: "Track engagement, goal completion, and impact over time.",
  },
  "ai-assistant": {
    eyebrow: "AI Partner",
    title: "Men.AI Assistant",
    description: "Ask anything about your mentorship sessions, mentees, or career growth.",
  },
  help: {
    eyebrow: "Support",
    title: "Help Center",
    description: "Find answers and contact support.",
  },
};
type ActionStatus = "open" | "done";

type ActionItem = {
  id: number;
  title: string;
  owner: string;
  due: string;
  priority: "High" | "Medium" | "Low" | "Critical";
  status: ActionStatus;
  fullData?: any;
};

type Report = {
  id: number;
  title: string;
  mentee: string;
  date: string;
  duration: string;
  status: "Ready" | "Draft" | "Processing";
  tone: string;
  initials: string;
  reportContent?: any;
};

type Meeting = {
  id: number;
  meeting_title: string;
  meeting_date: string;
  description: string | null;
  processing_status: string;
  mentee_id: number;
  mentor_id: number;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "overdue";
  mentee_id: number;
  require_file_upload?: boolean;
  completion_description?: string | null;
  uploaded_file_name?: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  related_meeting?: string | null;
  category?: string | null;
  notes?: string | null;
};

type Mentee = {
  id: number;
  full_name: string;
  email: string;
  assigned_at: string;
};

interface AnalyticsViewProps {
  mentees: any[];
  tasks: any[];
  meetings: any[];
  reports: any[];
  userRole: string;
}


function LogoMark() {
  return (
    <div className="logo-mark" aria-label="Men.AI">
      <span className="logo-orbit logo-orbit-one" />
      <span className="logo-orbit logo-orbit-two" />
      <span className="logo-dot" />
    </div>
  );
}

function Avatar({ initials, tone = "blue", size = "md" }: { initials: string; tone?: string; size?: "sm" | "md" | "lg" }) {
  return <div className={`avatar avatar-${tone} avatar-${size}`}>{initials}</div>;
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function MiniTrend() {
  return (
    <div className="mini-trend" aria-label="Weekly progress trend">
      <svg viewBox="0 0 220 70" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#5d86ff" stopOpacity=".28" />
            <stop offset="100%" stopColor="#5d86ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 59 C22 56 28 45 48 49 S71 46 87 41 S108 48 124 33 S145 31 159 22 S184 26 220 7 V70 H0 Z" fill="url(#area)" />
        <path d="M0 59 C22 56 28 45 48 49 S71 46 87 41 S108 48 124 33 S145 31 159 22 S184 26 220 7" fill="none" stroke="#4678f7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="220" cy="7" r="4" fill="#4678f7" />
      </svg>
      <div className="trend-labels"><span>Nov 04</span><span>Today</span></div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="progress-ring" aria-label={`${value}% goal progress`}>
      <svg viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r={radius} className="ring-track" />
        <circle cx="42" cy="42" r={radius} className="ring-value" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <strong>{value}%</strong>
    </div>
  );
}

function ReportRow({ report, onOpen }: { report: Report; onOpen: (report: Report) => void }) {
  return (
    <button className="report-row" onClick={() => onOpen(report)}>
      <Avatar initials={report.initials} tone={report.tone} />
      <span className="report-row-copy">
        <strong>{report.title}</strong>
        <small>{report.mentee} <span>·</span> {report.date}</small>
      </span>
      <span className="report-row-duration"><Clock3 size={14} /> {report.duration}</span>
      <Pill tone={report.status === "Ready" ? "ready" : report.status === "Draft" ? "draft" : "processing"}>{report.status}</Pill>
      <ChevronRight className="row-chevron" size={17} />
    </button>
  );
}

function ActionRow({ item, onToggle, onEdit, onDelete, userRole, onViewDetails }: { item: ActionItem; onToggle: (id: number) => void; onEdit: (item: ActionItem) => void; onDelete: (item: ActionItem) => void; userRole: string; onViewDetails: (item: ActionItem) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Make the entire row clickable for details view
  const handleRowClick = () => {
    onViewDetails(item);
  };

  return (
    <div className={`action-row ${item.status === "done" ? "action-done" : ""}`} onClick={handleRowClick} style={{ cursor: 'pointer' }}>
      <button className="action-check" aria-label={`Mark ${item.title} ${item.status === "done" ? "open" : "complete"}`} onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}>
        {item.status === "done" ? <Check size={14} strokeWidth={3} /> : <Circle size={18} strokeWidth={1.5} />}
      </button>
      <span className="action-copy">
        <strong>{item.title}</strong>
        <small><span className="owner-dot" /> {item.owner} <span>·</span> due {item.due}</small>
      </span>
      <Pill tone={item.priority.toLowerCase()}>{item.priority}</Pill>
      <div className="action-menu" ref={menuRef}>
        <button className="icon-button subtle" aria-label="More action options" aria-expanded={menuOpen} onClick={(e) => { e.stopPropagation(); setMenuOpen((open) => !open); }}>
          <MoreHorizontal size={17} />
        </button>
        {menuOpen && (
          <div className="action-menu-dropdown">
            {userRole === "mentor" && (
              <>
                <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(item); }}>
                  <Edit3 size={15} /> Edit
                </button>
                <button className="dropdown-item danger" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(item); }}>
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsView({
  reports,
  onOpen,
  onNew,
  onCardShare,
  onCardDelete,
}: {
  reports: Report[];
  onOpen: (report: Report) => void;
  onNew: () => void;
  onCardShare: (reportId: number, title: string) => void;
  onCardDelete: (reportId: number, title: string) => void;
}) {
  const [cardMenuOpenId, setCardMenuOpenId] = useState<number | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest'>('newest');
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const totalReportsCount = reports.length;

  // Close sort menu when clicking outside
  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortMenuOpen]);

  // Sort reports by creation date
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const dateA = a.reportContent?.created_at ? new Date(a.reportContent.created_at).getTime() :
                    a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.reportContent?.created_at ? new Date(b.reportContent.created_at).getTime() :
                    b.date ? new Date(b.date).getTime() : 0;
      return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [reports, sortOption]);

  return (
    <div className="view-stack">
      <div className="library-summary">
        <div className="library-summary-main">
          <div className="summary-icon"><FileText size={21} /></div>
          <span>
            <strong>{totalReportsCount} reports</strong>
            <small>Across active mentorships</small>
          </span>
        </div>
        <button className="primary-button" onClick={onNew}>
          <Plus size={17} /> New report
        </button>
      </div>
      <div className="library-toolbar surface-card">
        <div className="library-tabs">
          <button className="library-tab active">
            All reports <span>{totalReportsCount}</span>
          </button>
        </div>
        <div className="relative">
          <button
            className="filter-button"
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            aria-label="Sort options"
            aria-expanded={sortMenuOpen}
          >
            <SlidersHorizontal size={14} /> Sort: {sortOption === 'newest' ? 'newest' : 'oldest'} <ChevronDown size={14} />
          </button>
          {sortMenuOpen && (
            <div ref={sortMenuRef} className="action-menu-dropdown" style={{ right: 0, top: '100%', marginTop: '4px', zIndex: 20 }}>
              <button
                className={`dropdown-item ${sortOption === 'newest' ? 'active' : ''}`}
                onClick={() => { setSortOption('newest'); setSortMenuOpen(false); }}
              >
                Newest
              </button>
              <button
                className={`dropdown-item ${sortOption === 'oldest' ? 'active' : ''}`}
                onClick={() => { setSortOption('oldest'); setSortMenuOpen(false); }}
              >
                Oldest
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="report-library-grid">
        {sortedReports.map((report) => (
          <div key={report.id} className="library-report surface-card" style={{ position: 'relative' }}>
            <button
              className="library-report-main"
              onClick={() => onOpen(report)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <div className={`library-report-art art-${report.tone}`}>
                <span><FileText size={24} /></span>
                <Pill tone={report.status === "Ready" ? "ready" : "draft"}>{report.status}</Pill>
              </div>
              <div className="library-report-copy">
                <strong>{report.title}</strong>
                <small>{report.mentee} · {report.date}</small>
                <div>
                  <span><Clock3 size={13} /> {report.duration}</span>
                  <span><ListChecks size={13} /> 4 actions</span>
                </div>
              </div>
            </button>
            <div className="relative" style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10 }}>
              <button
                className="icon-button subtle"
                aria-label="More actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setCardMenuOpenId(prev => prev === report.id ? null : report.id);
                }}
              >
                <MoreHorizontal size={18} />
              </button>
              {cardMenuOpenId === report.id && (
                <div className="action-menu-dropdown" style={{ right: 0, top: '100%', marginTop: '4px' }}>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onCardShare(report.id, report.title);
                      setCardMenuOpenId(null);
                    }}
                  >
                    Share
                  </button>
                  <button
                    className="dropdown-item danger"
                    onClick={() => {
                      onCardDelete(report.id, report.title);
                      setCardMenuOpenId(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}


function SessionsView({
  isRecording,
  setIsRecording,
  onNew,
  onReportOpen,
}: {
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  onNew: () => void;
  onReportOpen: (reportId: number | null) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userRole = user?.role || 'mentee';

  const { data: mentees = [] } = useQuery<Mentee[]>({
    queryKey: ['mentor-mentees'],
    queryFn: async () => {
      if (userRole === 'mentor') {
        const response = await api.get('/assignments/my-mentees');
        return response.data;
      }
      return [];
    },
    enabled: userRole === 'mentor',
  });

  const [topic, setTopic] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');
  const [selectedMenteeId, setSelectedMenteeId] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Refs keep the active recording objects available to event handlers
  // and cleanup without relying on outdated React state.
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Generate the report from the uploaded meeting.
  const generateReport = async (audioBlob: Blob) => {
    setIsGeneratingReport(true);
    setReportError(null);

    try {
      const formData = new FormData();

      // A mentor must specify the mentee.
      // A mentee is identified by the authenticated backend user.
      if (userRole === 'mentor') {
        if (!selectedMenteeId) {
          throw new Error('Please select a mentee.');
        }

        formData.append('mentee_id', selectedMenteeId.toString());
      }

      formData.append('meeting_title', topic.trim());
      formData.append('meeting_date', new Date().toISOString());
      formData.append('description', sessionGoal.trim());

      formData.append(
        'files',
        audioBlob,
        'recording.webm'
      );

      // Step 1: Upload recording and create meeting.
      const meetingResponse = await api.post(
        '/meetings/create-meeting',
        formData
      );
      const meetingId = meetingResponse.data?.meeting_id;

      if (!meetingId) {
        throw new Error('The server did not return a meeting ID.');
      }

      // Step 2: Generate report from the transcript saved by the backend.
      // const reportResponse = await api.post(
      //   `/generate-report/${meetingId}`
      // );

      const reportResponse = await api.post(
        `/meetings/generate-report/${meetingId}`
      );

      const reportId = reportResponse.data?.report_id;

      if (!reportId) {
        throw new Error('The server did not return a report ID.');
      }

      // Refresh meeting and report data.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meetings'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ]);

      toast.success('Report generated', {
        description: 'Your session report is ready.',
      });

      // Open the newly generated report in the existing report preview.
      onReportOpen(reportId);

    } catch (err: any) {
      console.error('Session report generation error:', err);

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to generate the report. Please try again.';

      setReportError(message);

      toast.error('Report generation failed', {
        description: message,
      });

    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Start microphone recording.
  const startRecording = async () => {
    console.log('[Recording] Start button clicked');
    console.log('[Recording] isGeneratingReport:', isGeneratingReport);
console.log('[Recording] topic:', topic);
console.log('[Recording] userRole:', userRole);
console.log('[Recording] mentees:', mentees.length);
console.log('[Recording] selectedMenteeId:', selectedMenteeId);
console.log('[Recording] sessionGoal:', sessionGoal);
    if (isGeneratingReport) return;

    if (!topic.trim()) {
      toast.error('Validation error', {
        description: 'Please enter a session topic.',
      });
      return;
    }

    if (userRole === 'mentor' && mentees.length === 0) {
      toast.error('Validation error', {
        description: 'No active mentees assigned. Assign a mentee first.',
      });
      return;
    }

    if (userRole === 'mentor' && !selectedMenteeId) {
      toast.error('Validation error', {
        description: 'Please select a mentee.',
      });
      return;
    }

    if (!sessionGoal.trim()) {
      toast.error('Validation error', {
        description: 'Please enter the session goal.',
      });
      return;
    }

    let stream: MediaStream | null = null;

    try {
      console.log('[Recording] Checking browser support...');
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      console.log('[Recording] Browser support confirmed.');
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        throw new Error(
          'This browser does not support WebM audio recording.'
        );
      }

      console.log('[Recording] WebM supported. Requesting microphone...');
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log('[Recording] Microphone access granted.');

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        toast.error('Recording error', {
          description: 'An error occurred while recording audio.',
        });
      };

      // The browser fires ondataavailable for the final chunk
      // before firing onstop. Upload only after onstop.
      recorder.onstop = () => {
        if (timerIntervalRef.current !== null) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        const recordedStream = mediaStreamRef.current;

        if (recordedStream) {
          recordedStream.getTracks().forEach(track => track.stop());
        }

        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        setIsRecording(false);

        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];

        if (chunks.length === 0) {
          toast.error('Recording error', {
            description: 'No audio was recorded.',
          });
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: 'audio/webm',
        });

        if (audioBlob.size === 0) {
          toast.error('Recording error', {
            description: 'The recording is empty.',
          });
          return;
        }

        // Upload the completed recording and generate its report.
        void generateReport(audioBlob);
      };

      recorder.start();

      setElapsedMs(0);

      const startTime = Date.now();

      timerIntervalRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 250);

      setReportError(null);
      setIsRecording(true);

    } catch (err) {
      console.error('[Recording] Start failed:', err);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;

      toast.error('Recording failed', {
        description:
          err instanceof Error
            ? err.message
            : 'Could not start recording.',
      });
    }
  };

  // Stop recording. The onstop handler handles the final audio chunks.
  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    setIsRecording(false);

    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    recorder.stop();
  };

  // Clean up microphone and timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== 'inactive') {
        // Do not start an upload while the component is unmounting.
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="session-view">
      <div className={`session-stage surface-card ${isRecording ? 'session-live' : ''}`}>
        <div className="session-stage-top">
          <span className="section-kicker">Live capture room</span>

          <Pill tone={isRecording ? 'recording' : 'neutral'}>
            {isRecording ? (
              <><i className="record-dot" /> Recording now</>
            ) : isGeneratingReport ? (
              'Generating report'
            ) : 'Ready to capture'}
          </Pill>
        </div>

        <div className="session-visual">
          <div className="soundwave">
            {[...Array(15)].map((_, i) => (
              <i key={i} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>

          <div className="session-core">
            <AudioLines size={31} />

            {isRecording && (
              <span className="session-timer">
                {formatTime(elapsedMs)}
              </span>
            )}
          </div>

          <div className="soundwave mirrored">
            {[...Array(15)].map((_, i) => (
              <i key={i} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>

        <h2>
          {isRecording
            ? "You're in the room."
            : isGeneratingReport
              ? 'Preparing your report.'
              : 'A better note-taker is waiting.'}
        </h2>

        <p>
          {isRecording
            ? 'Stay present. Men.AI is listening for themes, decisions, and the next right step.'
            : isGeneratingReport
              ? 'Your recording is being processed and your AI report is being generated. Please wait.'
              : 'Capture your next mentorship session and let AI surface what matters.'}
        </p>

        <div className="session-buttons">
          {isRecording ? (
            <button className="stop-button" onClick={stopRecording}>
              <span /> Stop recording
            </button>
          ) : (
            <button
              className="primary-button large"
              onClick={startRecording}
              disabled={isGeneratingReport}
            >
              <Mic2 size={18} />
              {isGeneratingReport ? 'Generating report...' : 'Start recording'}
            </button>
          )}

          <button
            className="secondary-button large"
            onClick={onNew}
            disabled={isRecording || isGeneratingReport}
          >
            <FileUp size={17} /> Upload transcript
          </button>
        </div>

        {isGeneratingReport && (
          <p role="status" aria-live="polite">
            Please keep this page open while your report is generated.
          </p>
        )}

        {reportError && (
          <p role="alert" style={{ color: '#dc2626' }}>
            {reportError}
          </p>
        )}
      </div>

      <div className="session-side">
        <div className="surface-card session-meta">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Before you begin</span>
              <h3>Session context</h3>
            </div>
            <Settings2 size={17} />
          </div>

          {userRole === 'mentor' ? (
            <label>
              Mentee
              <select
                value={selectedMenteeId || ''}
                onChange={(e) =>
                  setSelectedMenteeId(Number(e.target.value) || null)
                }
                disabled={isRecording || isGeneratingReport}
              >
                <option value="">Select a mentee</option>

                {mentees.map((mentee) => (
                  <option key={mentee.id} value={mentee.id}>
                    {mentee.full_name}
                  </option>
                ))}
              </select>

              {mentees.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No active mentees assigned. Assign mentees first.
                </span>
              )}
            </label>
          ) : (
            <div className="text-sm text-muted-foreground">
              Mentee: {user?.full_name || 'Mentee'}
            </div>
          )}

          <label>
            Topic
            <input
              placeholder="e.g. Portfolio review"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isRecording || isGeneratingReport}
            />
          </label>

          <label>
            Session goal
            <textarea
              placeholder="What would make this conversation useful?"
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              disabled={isRecording || isGeneratingReport}
              rows={3}
            />
          </label>
        </div>

        <div className="ai-tip">
          <span>
            <strong>Men.AI will look for</strong>
            <small>
              Decisions · key themes · commitments · signals of progress
            </small>
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionsView({ actions, filter, setFilter, onToggle, onAdd, onEdit, onDelete, userRole, onViewDetails }: { actions: ActionItem[]; filter: "all" | "open" | "done"; setFilter: (value: "all" | "open" | "done") => void; onToggle: (id: number) => void; onAdd: () => void; onEdit: (item: ActionItem) => void; onDelete: (item: ActionItem) => void; userRole: string; onViewDetails: (item: ActionItem) => void }) {
  const openActionsCount = actions.filter(action => action.status === "open").length;
  const completedActionsCount = actions.filter(action => action.status === "done").length;
  const totalActionsCount = actions.length;

  return <div className="view-stack"><div className="action-board-header surface-card"><div><span className="section-kicker">This week</span><h2>Small promises, kept</h2><p>{totalActionsCount} action items are connected to your reports.</p></div><div className="action-board-score"><strong>{completedActionsCount}<span>/{totalActionsCount}</span></strong><small>complete</small></div></div><div className="actions-toolbar"><div className="filter-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{totalActionsCount}</span></button><button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>Open <span>{openActionsCount}</span></button><button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Completed <span>{completedActionsCount}</span></button></div>{userRole === "mentor" && (
  <button className="secondary-button" onClick={onAdd}>
    <Plus size={16} /> Add action
  </button>
)}</div><div className="surface-card full-actions-card">{actions.map((item) => <ActionRow key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} userRole={userRole} onViewDetails={onViewDetails} />)}</div></div>;
}

function PeopleView({
    onOpen,
    reports,
    mentees,
    onGenerateInvitation,
    isGeneratingCode,
    generatedInvitationCode,
    onCloseInvitation,
    onCopyCode
  }: {
    onOpen: (report: Report) => void;
    reports: Report[];
    mentees: Mentee[];
    onGenerateInvitation: () => void;
    isGeneratingCode: boolean;
    generatedInvitationCode: string | null;
    onCloseInvitation: () => void;
    onCopyCode: () => void;
  }) {
  const people = mentees.map((m, index) => ({
    initials: m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    tone: ["blue", "peach", "lavender"][index % 3],
    name: m.full_name,
    detail: `Joined ${new Date(m.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    progress: Math.min(100, Math.max(0, 50 + (index * 15))),
    status: index === 0 ? "Needs focus" : "On track"
  }));

  return (
    <div className="view-stack">
      <div className="people-header surface-card">
        <div>
          <span className="section-kicker">Mentorship roster</span>
          <h2>Relationships with context</h2>
          <p>See the human story behind every progress signal.</p>
        </div>
        <button
          className="primary-button"
          onClick={onGenerateInvitation}
          disabled={isGeneratingCode}
        >
          {isGeneratingCode ? (
            <>
              <RefreshCw size={17} className="spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus size={17} /> Add mentee
            </>
          )}
        </button>
      </div>
      <div className="people-grid">
        {people.length > 0 ? (
          people.map((person, index) => (
            <button className="person-card surface-card" key={person.name} onClick={() => onOpen(reports[index])}>
              <div className="person-top">
                <Avatar initials={person.initials} tone={person.tone} size="lg" />
                <Pill tone={person.status === "On track" ? "ready" : "attention"}>{person.status}</Pill>
              </div>
              <strong>{person.name}</strong>
              <small>{person.detail}</small>
              <div className="person-progress">
                <span><i style={{ width: `${person.progress}%` }} /></span>
                <b>{person.progress}%</b>
              </div>
              <div className="person-footer">
                <span><CalendarDays size={14} /> Last session {index === 0 ? "Today" : index === 1 ? "Yesterday" : "Nov 05"}</span>
                <ChevronRight size={16} />
              </div>
            </button>
          ))
        ) : (
          <div className="people-empty" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px'}}>
            <UsersRound size={32} style={{ opacity: 0.3, margin: '16px auto' }} />
            <p style={{ color: '#6a7a92', marginBottom: '16px' }}>No mentees assigned yet</p>
            <button className="primary-button" onClick={onGenerateInvitation} disabled={isGeneratingCode}>
              {isGeneratingCode ? (
                <>
                  <RefreshCw size={17} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus size={17} /> Add your first mentee
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Invitation Code Modal */}
      {generatedInvitationCode && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCloseInvitation(); }}>
          <div className="modal-card new-report-modal" style={{ maxWidth: '480px' }}>
            <button className="modal-close icon-button" onClick={onCloseInvitation} aria-label="Close">
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Share2 size={21} />
            </div>
            <span className="section-kicker">Invitation code generated</span>
            <h2>Share this code with your mentee</h2>
            <p>Your mentee can use this code to join your mentorship. The code expires in 7 days and can be used once.</p>

            <div className="invitation-code-display" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
              marginBottom: '24px',
              padding: '16px 20px',
              background: '#f4f7fb',
              borderRadius: '12px',
              border: '1px solid #edf1f5'
            }}>
              <code style={{
                flex: 1,
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '4px',
                color: '#15233e',
                fontFamily: 'monospace',
                textAlign: 'center'
              }}>
                {generatedInvitationCode}
              </code>
              <button
                className="icon-button"
                onClick={onCopyCode}
                aria-label="Copy invitation code"
                style={{ background: '#2f6bff', color: 'white', borderRadius: '8px', width: '44px', height: '44px' }}
              >
                <Copy size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6a7a92', textAlign: 'center', marginBottom: '24px' }}>
              Code expires in 7 days · Single use
            </p>

            <div className="generated-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                className="secondary-button"
                onClick={onCloseInvitation}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewReportModal({ close, title, setTitle, mentee, setMentee, mentees, selectedFile, setSelectedFile, isGenerating, generated, generate, onOpen, onShare, reportId, userRole }: { close: () => void; title: string; setTitle: (value: string) => void; mentee: string; setMentee: (value: string) => void; mentees: Mentee[]; selectedFile: File | null; setSelectedFile: (file: File | null) => void; isGenerating: boolean; generated: boolean; generate: () => void; onOpen: (reportId: number | null) => void; onShare: (reportId: number) => void; reportId: number | null; userRole: string }) {
  const [dragOver, setDragOver] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
  const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".mov", ".mkv", ".txt", ".pdf", ".docx"];

  const formatFileSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error("Unsupported file type", { description: `Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}` });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", { description: "Maximum file size is 500 MB." });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card new-report-modal"><button className="modal-close icon-button" onClick={close} aria-label="Close"><X size={18} /></button>{generated ? <div className="generated-state"><div className="generated-icon"><Mic2 size={26} /></div><span className="section-kicker">Report generated</span><h2>Your conversation has shape.</h2><p>Men.AI found a clear summary, 3 themes, and 4 next steps from this session.</p><div className="generated-preview"><div><Sparkles size={16} /><span><strong>{title}</strong><small>{mentee} · Ready to review</small></span></div><Pill tone="ready">Ready</Pill></div><div className="generated-actions"><button className="primary-button" onClick={() => { close(); onOpen(reportId); }}>Open report <ArrowUpRight size={16} /></button><button className="secondary-button" onClick={() => onShare(reportId)}><Share2 size={15} /> Share</button></div></div> : <><div className="modal-icon"><WandSparkles size={21} /></div><span className="section-kicker">New AI report</span><h2>What are we unpacking?</h2><p>Give this session a little context. Men.AI will take it from there.</p><div className="source-switcher"><button className="source-option active"onClick={() => setShowComingSoon(true)}><Mic2 size={18} /><span><strong>Live session</strong><small>Record in the room</small></span><CheckCircle2 size={17} /></button><button className="source-option" onClick={() => fileInputRef.current?.click()}><FileUp size={18} /><span><strong>Upload a file</strong><small>Audio, video, or transcript</small></span><Plus size={17} /></button></div><div className="form-grid"><label>Session title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>{userRole === "mentor" && <label>Mentee<select value={mentee} onChange={(event) => setMentee(event.target.value)}><option value="">Select a mentee</option>{mentees.map((m) => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}</select></label>}</div><label className={`drop-zone ${dragOver ? "drag-over" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}><input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.txt,.pdf,.docx" onChange={(e) => { if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]); }} style={{ display: "none" }} /><FileUp size={21} /><span><strong>{selectedFile ? selectedFile.name : "Drop a conversation file here"}</strong><small>{selectedFile ? `${formatFileSize(selectedFile.size)} · Click to replace` : "or browse from your computer · up to 500 MB"}</small></span>{selectedFile && <button type="button" className="icon-button subtle" onClick={removeFile} aria-label="Remove file"><X size={16} /></button>}</label><button className="primary-button modal-submit" onClick={generate} disabled={isGenerating || !selectedFile}>{isGenerating ? <><RefreshCw size={17} className="spin" /> Generating report...</> : <><Sparkles size={17} /> Generate with Men.AI</>}</button><p className="modal-note"><Check size={14} /> You can review and edit every section before sharing.</p></>}</div>

{showComingSoon && (
  <div
    className="modal-backdrop"
    role="presentation"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setShowComingSoon(false);
      }
    }}
  >
    <div
  className="modal-card coming-soon-modal"
  role="dialog"
  aria-modal="true"
  style={{
    width: "min(420px, calc(100vw - 32px))",
    maxWidth: "420px",
    padding: "36px 28px 28px",
    boxSizing: "border-box",
    textAlign: "center",
    overflow: "hidden",
  }}
>
      <button
        className="modal-close icon-button"
        onClick={() => setShowComingSoon(false)}
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div className="generated-icon">
        <Mic2 size={26} />
      </div>

      <span className="section-kicker">Live sessions</span>
      <h2>Coming Soon in Phase 2</h2>
      <p>
        We're working on bringing live mentorship sessions
        to your workspace. Stay tuned!
      </p>

      <button
        className="primary-button"
        onClick={() => setShowComingSoon(false)}
      >
        Got it
      </button>
    </div>
  </div>
)}

</div>;
}

function ReportPreview({ report, close, onRefine, onOpenShare, queryClient }: { report: Report; close: () => void; onRefine: () => void; onOpenShare: () => void; queryClient: ReturnType<typeof useQueryClient> }) {
  const content = report.reportContent as any;
  const summary = content?.meeting_summary || "";
  const themes = content?.discussion_points || [];

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card report-preview-modal"><div className="preview-topbar"><div><button className="back-button" onClick={close}><ChevronRight size={16} className="rotate-180" /> Back to workspace</button><span className="section-kicker">AI-generated report</span><h2>{report.title}</h2><p><Avatar initials={report.initials} tone={report.tone} size="sm" /> {report.mentee} <span>·</span> {report.date}</p></div><div className="preview-top-actions"><button className="icon-button subtle" aria-label="Archive report" onClick={() => toast.success("Report archived")}><Archive size={17} /></button><button className="secondary-button" onClick={onOpenShare}><Share2 size={15} /> Share</button><button className="primary-button" onClick={async () => {
  try {
    const response = await api.post(`/reports/${report.id}/download-pdf`, {}, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${report.id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("PDF downloaded successfully");
  } catch (err) {
    toast.error("Failed to download PDF");
  }
}}
><Download size={15} /> Export PDF</button>
<button className="secondary-button" onClick={async () => {
  try {
    const response = await api.post(`/reports/${report.id}/download-docx`, {}, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${report.id}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("DOCX downloaded successfully");
  } catch (err) {
    toast.error("Failed to download DOCX");
  }
}}>
  <Download size={15} /> Export DOCX
</button><button className="icon-button modal-close" onClick={close} aria-label="Close"><X size={18} /></button></div></div><div className="report-preview-layout"><article className="report-document"><div className="report-document-meta"><Pill tone="ready">Ready to share</Pill><span><Clock3 size={14} /> AI reviewed by you</span></div><div className="report-section report-summary"><div className="report-section-title"><span className="number-badge">01</span><div><span className="section-kicker">Meeting summary</span><h3>{summary || "No summary available."}</h3></div><button className="edit-link" onClick={onRefine}><WandSparkles size={14} /> Refine with AI</button></div><p>{summary || "No summary available."}</p></div><div className="report-section"><div className="report-section-title"><span className="number-badge">02</span><div><span className="section-kicker">Key themes</span><h3>What surfaced in the room</h3></div><button className="icon-button subtle" onClick={() => toast.success("Key themes copied")}><Copy size={15} /></button></div><div className="theme-grid">{themes.length > 0 ? themes.map((t: string, i: number) => <span key={i}>{t}</span>) : <span>No themes identified.</span>}</div></div></article></div></div></div>;
}

function AnalyticsView({
  mentees,
  tasks,
  meetings,
  reports,
  userRole,
}: AnalyticsViewProps) {
  // Only show analytics for mentors
  if (userRole !== 'mentor') {
    return (
      <div className="view-stack">
        <div className="people-header surface-card">
          <div>
            <span className="section-kicker">Your Progress</span>
            <h2>Track your growth</h2>
            <p>View your action items and progress over time.</p>
          </div>
        </div>
        <div className="surface-card" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#6a7a92' }}>Progress analytics are available for mentors. Connect with a mentor to see your progress.</p>
        </div>
      </div>
    );
  }

  // Calculate KPI metrics
  const totalMentees = mentees.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.deadline || t.status === 'completed') return false;
    return new Date(t.deadline).getTime() < Date.now();
  }).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalReports = reports.length;
  const totalMeetings = meetings.length;

  // Priority breakdown
  const priorityBreakdown = {
    low: tasks.filter(t => t.priority === 'low').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    high: tasks.filter(t => t.priority === 'high').length,
    critical: tasks.filter(t => t.priority === 'critical').length,
  };

  // Weekly completion trend (last 12 weeks)
const weeklyCompletionData = useMemo(() => {

  const weeklyData: Record<string, number> = {};
  const now = new Date();

  // Initialize last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyData[weekKey] = 0;
  }

  tasks.forEach(task => {
    if (task.status === 'completed' && task.completed_at) {
      const completedDate = new Date(task.completed_at);
      const weekStart = new Date(completedDate);
      weekStart.setDate(completedDate.getDate() - completedDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (weeklyData.hasOwnProperty(weekKey)) {
        weeklyData[weekKey] += 1;
      }
    }
  });

  return Object.entries(weeklyData)
    .map(([week, count], index) => ({
    week: `Week ${index + 1}`,
    completed: count,
  }))
    .slice(-12);
}, [tasks]);

// Debug log — outside useMemo
console.table(weeklyCompletionData);

  // Mentee progress comparison
  const menteeProgressData = useMemo(() => {
    return mentees.map(mentee => {
      const menteeTasks = tasks.filter(t => t.mentee_id === mentee.id);
      const menteeTotal = menteeTasks.length;
      const menteeCompleted = menteeTasks.filter(t => t.status === 'completed').length;
      const menteePending = menteeTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
      const menteeOverdue = menteeTasks.filter(t => {
        if (!t.deadline || t.status === 'completed') return false;
        return new Date(t.deadline).getTime() < Date.now();
      }).length;
      const menteeRate = menteeTotal > 0 ? (menteeCompleted / menteeTotal) * 100 : 0;

      return {
        name: mentee.full_name || `Mentee ${mentee.id}`,
        total: menteeTotal,
        completed: menteeCompleted,
        pending: menteePending,
        overdue: menteeOverdue,
        completionRate: menteeRate,
      };
    });
  }, [mentees, tasks]);

  // Report status distribution
  const reportStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(report => {
      const status = report.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const STATUS_CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#e74c3c'];

  return (
    <div className="view-stack">
      <div className="people-header surface-card">
        <div>
          <span className="section-kicker">Performance insights</span>
          <h2>Data behind the growth</h2>
          <p>Track engagement, goal completion, and impact over time.</p>
        </div>
        {/* <button className="secondary-button" onClick={() => toast.info("Exporting analytics")}>
          <Download size={16} /> Export report
        </button> */}
      </div>

      {/* KPI Cards */}
      <section className="metric-strip">
        <div className="metric-item">
          <span className="metric-icon metric-blue"><UsersRound size={17} /></span>
          <span><small>Connected Mentees</small><strong>{totalMentees}</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-coral"><ListChecks size={17} /></span>
          <span><small>Total Action Items</small><strong>{totalTasks}</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-green"><CheckCircle2 size={17} /></span>
          <span><small>Completed</small><strong>{completedTasks}</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-yellow"><Clock3 size={17} /></span>
          <span><small>Pending</small><strong>{pendingTasks}</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-red"><AlertCircle size={17} /></span>
          <span><small>Overdue</small><strong>{overdueTasks}</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-purple"><Target size={17} /></span>
          <span><small>Completion Rate</small><strong>{completionRate.toFixed(1)}%</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-blue"><FileText size={17} /></span>
          <span><small>Reports Generated</small><strong>{totalReports}</strong></span>
        </div>
        <div className="metric-item">
          <span className="metric-icon metric-coral"><CalendarDays size={17} /></span>
          <span><small>Meetings Conducted</small><strong>{totalMeetings}</strong></span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Completion Trend */}
        <div className="surface-card" style={{ padding: '24px' }}>
          <h3>Weekly Completion Trend</h3>
          {weeklyCompletionData.length > 0 ? (
            <div style={{ height: '280px', marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyCompletionData}
                  margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="mentorSmoothGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#4678f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4678f7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed Tasks"
                    stroke="#4678f7"
                    strokeWidth={3}
                    fill="url(#mentorSmoothGradient)"
                    dot={{
                      fill: "#ffffff",
                      stroke: "#4678f7",
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#4678f7",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted-copy" style={{ marginTop: '24px', textAlign: 'center' }}>No completion data available yet</p>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="surface-card" style={{ padding: '24px' }}>
          <h3>Priority Breakdown</h3>
          <div className="grid grid-cols-2 gap-4" style={{ marginTop: '16px' }}>
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <h4 className="text-xs font-medium text-gray-500 mb-1">Low</h4>
              <h2 className="text-2xl font-bold">{priorityBreakdown.low}</h2>
            </div>
            <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800">
              <h4 className="text-xs font-medium mb-1">Medium</h4>
              <h2 className="text-2xl font-bold">{priorityBreakdown.medium}</h2>
            </div>
            <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-800">
              <h4 className="text-xs font-medium mb-1">High</h4>
              <h2 className="text-2xl font-bold">{priorityBreakdown.high}</h2>
            </div>
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-800">
              <h4 className="text-xs font-medium mb-1">Critical</h4>
              <h2 className="text-2xl font-bold">{priorityBreakdown.critical}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: '24px' }}>
        {/* Mentee Progress Comparison */}
        <div className="surface-card" style={{ padding: '24px' }}>
          <h3>Mentee Progress Comparison</h3>
          {menteeProgressData.length > 0 ? (
            <div className="overflow-x-auto" style={{ marginTop: '16px' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2">Mentee</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Completed</th>
                    <th className="text-right p-2">Pending</th>
                    <th className="text-right p-2">Overdue</th>
                    <th className="text-right p-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {menteeProgressData.map((mentee) => (
                    <tr key={mentee.name} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-2 font-medium">{mentee.name}</td>
                      <td className="p-2 text-right">{mentee.total}</td>
                      <td className="p-2 text-right text-green-600">{mentee.completed}</td>
                      <td className="p-2 text-right text-yellow-600">{mentee.pending}</td>
                      <td className="p-2 text-right text-red-600">{mentee.overdue}</td>
                      <td className="p-2 text-right font-semibold">{mentee.completionRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted-copy" style={{ marginTop: '24px', textAlign: 'center' }}>No mentees connected yet</p>
          )}
        </div>

        {/* Report Status Distribution */}
        <div className="surface-card" style={{ padding: '24px' }}>
          <h3>Report Status Distribution</h3>
          {reportStatusData.length > 0 ? (
            <div style={{ height: '280px', marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {reportStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted-copy" style={{ marginTop: '24px', textAlign: 'center' }}>No reports generated yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AIAssistantView() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Men.AI Assistant. I can help you summarize sessions, track mentee progress, or prepare for your next meeting. What's on your mind?" }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      // Build conversation history for context
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await api.post('/assistant/chat', {
        message: userMessage,
        conversation_history: history,
      });

      const data = response.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't generate a response."
      }]);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Failed to get response from AI assistant";
      setError(detail);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${detail}`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="view-stack" style={{ height: 'calc(100vh - 250px)' }}>
      <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-heading" style={{ borderBottom: '1px solid #edf1f5' }}>
          <div><span className="section-kicker">AI Partner</span><h3>Chat with Men.AI</h3></div>
          <Sparkles size={18} className="text-primary" />
        </div>

        {error && (
          <div style={{ padding: '12px 24px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', borderBottom: '1px solid #fecaca' }}>
            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: m.role === 'user' ? '#2f6bff' : '#f4f7fb',
              color: m.role === 'user' ? 'white' : '#15233e',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              fontSize: '13px',
              lineHeight: 1.5
            }}>
              {m.content}
            </div>
          ))}

          {isSending && (
            <div style={{ alignSelf: 'flex-start', background: '#f4f7fb', padding: '12px 16px', borderRadius: '14px 14px 14px 2px', fontSize: '13px', color: '#6a7a92' }}>
              <RefreshCw size={14} className="spin" style={{ display: 'inline', marginRight: '6px' }} />
              Men.AI is thinking...
            </div>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #edf1f5' }}>
          <div className="search-wrap" style={{ width: '100%', maxWidth: 'none' }}>
            <Sparkles size={17} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your mentorship practice..."
              disabled={isSending}
              style={{ width: '100%' }}
            />
            <button className="icon-button" onClick={handleSend} disabled={isSending} style={{ background: '#2f6bff', color: 'white', borderRadius: '6px', width: '28px', height: '28px' }}>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="ai-tip">
        <div className="tip-icon"><WandSparkles size={17} /></div>
        <span><strong>Try asking</strong><small>"Summarize my mentees' recent progress" or "Prepare a growth plan for my mentees"</small></span>
      </div>
    </div>
  );
}

interface AddActionModalProps {
  close: () => void;
  onAdd: (data: any) => void;
  defaultData?: any;
  mentees: Mentee[];
}

function AddActionModal({ close, onAdd, defaultData, mentees }: AddActionModalProps) {
  const [title, setTitle] = useState(defaultData?.title || '');
  const [description, setDescription] = useState(defaultData?.description || '');
  const [assignedTo, setAssignedTo] = useState(defaultData?.assigned_to || 'You');
  const [assignedMenteeId, setAssignedMenteeId] = useState(defaultData?.mentee_id || null);
  const [relatedMeeting, setRelatedMeeting] = useState(defaultData?.related_meeting || '');
  const [priority, setPriority] = useState(defaultData?.priority ? defaultData.priority.charAt(0).toUpperCase() + defaultData.priority.slice(1) : 'Medium');
  const [status, setStatus] = useState(defaultData?.status ? defaultData.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Pending');
  const [dueDate, setDueDate] = useState(defaultData?.due_date || '');
  const [category, setCategory] = useState(defaultData?.category || 'General');
  const [notes, setNotes] = useState(defaultData?.notes || '');
  const [requireFileUpload, setRequireFileUpload] = useState(defaultData?.require_file_upload || false);

  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = ['Pending', 'In Progress', 'Completed'];
  const categoryOptions = ['General', 'Meeting Follow-up', 'Study', 'Project', 'Career', 'Personal'];

  // Build assigned options dynamically: "You" + connected mentees
  const assignedOptions = useMemo(() => {
    const options = ['You'];
    mentees.forEach(m => options.push(m.full_name));
    return options;
  }, [mentees]);

  // Find mentee ID when assignedTo changes
  const handleAssignedToChange = (value: string) => {
    setAssignedTo(value);
    if (value === 'You') {
      setAssignedMenteeId(null);
    } else {
      const mentee = mentees.find(m => m.full_name === value);
      setAssignedMenteeId(mentee?.id || null);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const actionData = {
      title: title.trim(),
      description: description.trim() || null,
      assignedTo: assignedTo || 'You',
      menteeId: assignedMenteeId,
      relatedMeeting: relatedMeeting.trim() || null,
      priority: priority.toLowerCase(),
      status: status.toLowerCase().replace(' ', '_'),
      dueDate: dueDate || null,
      category: category,
      notes: notes.trim() || null,
      requireFileUpload: requireFileUpload,
    };

    onAdd(actionData);
    close();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-card new-report-modal" style={{maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'}}>
        <button className="modal-close icon-button" onClick={close}><X size={18} /></button>
        <h2>Add Action Item</h2>

        <div className="form-grid" style={{marginTop: '16px'}}>
          <label style={{gridColumn: 'span 2'}}>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Action item title..." required /></label>

          <label style={{gridColumn: 'span 2'}}>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of what needs to be done..." rows={3} /></label>

          <label>Assigned To<select value={assignedTo} onChange={(e) => handleAssignedToChange(e.target.value)}>{assignedOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label>Related Meeting<input value={relatedMeeting} onChange={(e) => setRelatedMeeting(e.target.value)} placeholder="e.g., Weekly mentorship sync" /></label>

          <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value)}>{priorityOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}>{statusOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label>Due Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>

          <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{categoryOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label style={{gridColumn: 'span 2'}}>Additional Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details, context, or notes..." rows={2} /></label>

          <label style={{gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <input
              type="checkbox"
              checked={requireFileUpload}
              onChange={(e) => setRequireFileUpload(e.target.checked)}
              style={{width: '18px', height: '18px'}}
            />
            <span style={{fontSize: '14px', fontWeight: 500}}>Require File Upload</span>
          </label>
          <label style={{gridColumn: 'span 2', fontSize: '12px', color: '#6a7a92', marginTop: '-8px', marginBottom: '8px'}}>
            When enabled, mentee must upload a file to complete this action item. When disabled, mentee must provide a completion description.
          </label>
        </div>

        <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
          <button className="primary-button modal-submit" onClick={handleSubmit} style={{flex: 1}}>Save Action</button>
          <button className="secondary-button modal-submit" onClick={close} style={{flex: 1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

interface ActionDetailsModalProps {
  close: () => void;
  action: ActionItem;
  userRole: string;
  onComplete: () => void;
}

function ActionDetailsModal({ close, action, userRole, onComplete }: ActionDetailsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionDescription, setCompletionDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check deadline on frontend
    if (action.fullData?.deadline && new Date(action.fullData.deadline) < new Date()) {
      setError("Cannot upload file after deadline has passed");
      return;
    }

    // Check if already completed
    if (action.status === "done" || action.fullData?.status === "completed") {
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

      const response = await api.post(`/tasks/mentee/${action.id}/complete-with-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    if (action.fullData?.deadline && new Date(action.fullData.deadline) < new Date()) {
      setError("Cannot complete task after deadline has passed");
      return;
    }

    // Check if already completed
    if (action.status === "done" || action.fullData?.status === "completed") {
      setError("Task is already completed");
      return;
    }

    // Check if file upload is required
    if (action.fullData?.require_file_upload) {
      setError("This task requires file upload completion");
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      await api.post(`/tasks/mentee/${action.id}/complete-with-description`,
        { completion_description: completionDescription.trim() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  const requireFileUpload = action.fullData?.require_file_upload;
  const isCompleted = action.status === "done" || action.fullData?.status === "completed";
  const isOverdue = action.fullData?.deadline && new Date(action.fullData.deadline) < new Date() && !isCompleted;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal-card new-report-modal" style={{maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto'}}>
        <button className="modal-close icon-button" onClick={close}><X size={18} /></button>
        <h2>Action Item Details</h2>

        {error && (
          <div style={{padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px'}}>
            <AlertCircle size={16} style={{display: 'inline', marginRight: '8px'}} />
            {error}
          </div>
        )}

        {success && (
          <div style={{padding: '12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', marginBottom: '16px', fontSize: '14px'}}>
            <CheckCircle2 size={16} style={{display: 'inline', marginRight: '8px'}} />
            {success}
          </div>
        )}

        <div className="form-grid" style={{marginTop: '16px'}}>
          <label style={{gridColumn: 'span 2'}}>
            <strong>Title</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '40px'}}>
              {action.title}
            </div>
          </label>

          <label style={{gridColumn: 'span 2'}}>
            <strong>Description</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '80px', whiteSpace: 'pre-wrap'}}>
              {action.fullData?.description || 'No description provided'}
            </div>
          </label>

          <label style={{gridColumn: 'span 2'}}>
            <strong>Additional Notes</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '60px', whiteSpace: 'pre-wrap'}}>
              {action.fullData?.notes || 'No additional notes'}
            </div>
          </label>

          <label>
            <strong>Assigned To</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '40px'}}>
              {action.owner}
            </div>
          </label>

          <label>
            <strong>Related Meeting</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '40px'}}>
              {action.fullData?.related_meeting || 'Not specified'}
            </div>
          </label>

          <label>
            <strong>Priority</strong>
            <Pill tone={action.priority.toLowerCase()}>{action.priority}</Pill>
          </label>

          <label>
            <strong>Status</strong>
            <Pill tone={action.status === "done" ? "ready" : action.status === "open" ? "neutral" : "draft"}>
              {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
            </Pill>
          </label>

          <label>
            <strong>Due Date</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '40px'}}>
              {formatDate(action.fullData?.deadline)}
              {isOverdue && <span style={{color: '#dc2626', marginLeft: '8px', fontWeight: 600}}>(OVERDUE)</span>}
            </div>
          </label>

          <label>
            <strong>Category</strong>
            <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '40px'}}>
              {action.fullData?.category || 'General'}
            </div>
          </label>

          {action.fullData?.completion_description && (
            <label style={{gridColumn: 'span 2'}}>
              <strong>Completion Description</strong>
              <div style={{padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', minHeight: '60px', whiteSpace: 'pre-wrap'}}>
                {action.fullData.completion_description}
              </div>
            </label>
          )}

          {action.fullData?.uploaded_file_name && (
            <label style={{gridColumn: 'span 2'}}>
              <strong>Uploaded File</strong>
              <div style={{padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <FileText size={24} style={{color: '#16a34a'}} />
                <span>{action.fullData.uploaded_file_name}</span>
              </div>
            </label>
          )}

          {action.fullData?.completed_at && (
            <label style={{gridColumn: 'span 2'}}>
              <strong>Completed At</strong>
              <div style={{padding: '12px', background: '#f4f7fb', borderRadius: '8px', border: '1px solid #edf1f5', minHeight: '40px'}}>
                {formatDateTime(action.fullData.completed_at)}
              </div>
            </label>
          )}
        </div>

        {/* Completion Interface */}
        {!isCompleted && !isOverdue && userRole === "mentee" && (
          <div style={{marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #edf1f5'}}>
            <h3 style={{marginBottom: '16px'}}>Complete This Action</h3>

            {requireFileUpload ? (
              <div>
                <p style={{color: '#6a7a92', marginBottom: '12px', fontSize: '14px'}}>
                  This action requires a file upload to complete. Please select a file below.
                </p>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.txt,.pdf,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{display: 'none'}}
                  id={`file-upload-${action.id}`}
                />
                <label
                  htmlFor={`file-upload-${action.id}`}
                  className="secondary-button"
                  style={{display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1}}
                >
                  <Upload size={16} />
                  {isUploading ? 'Uploading...' : 'Choose File & Complete'}
                </label>
              </div>
            ) : (
              <div>
                <label style={{display: 'block', marginBottom: '12px'}}>
                  <strong style={{display: 'block', marginBottom: '8px'}}>Completion Description (Required)</strong>
                  <textarea
                    value={completionDescription}
                    onChange={(e) => setCompletionDescription(e.target.value)}
                    placeholder="Describe what you completed and any outcomes..."
                    rows={4}
                    style={{width: '100%', padding: '12px', border: '1px solid #d0d8e2', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'}}
                    disabled={isCompleting}
                  />
                </label>
                <button
                  className="primary-button modal-submit"
                  onClick={handleDescriptionComplete}
                  disabled={isCompleting || !completionDescription.trim()}
                  style={{width: '100%'}}
                >
                  {isCompleting ? 'Completing...' : 'Mark as Completed'}
                </button>
              </div>
            )}
          </div>
        )}

        {(isCompleted || isOverdue || userRole === "mentor") && (
          <div style={{marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #edf1f5', color: '#6a7a92', fontSize: '14px'}}>
            {isCompleted ? (
              <><CheckCircle2 size={16} style={{display: 'inline', marginRight: '8px', color: '#16a34a'}} /> Task is completed</>
            ) : isOverdue ? (
              <><AlertCircle size={16} style={{display: 'inline', marginRight: '8px', color: '#dc2626'}} /> Task is overdue and cannot be completed</>
            ) : (
              <><Info size={16} style={{display: 'inline', marginRight: '8px'}} /> View only - mentee can complete this action</>
            )}
          </div>
        )}

        <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
          <button className="secondary-button modal-submit" onClick={close} style={{flex: 1}}>Close</button>
        </div>
      </div>
    </div>
  );
}

function HelpCenterView() {
  return (
    <div className="view-stack">
      <div className="surface-card p-8">
        <h3>Welcome to the Men.AI Help Center</h3>
        <p className="mt-4">If you need assistance, please contact us at support@men.ai.</p>
      </div>
    </div>
  );
}

function CommandModal({ close, onNew }: { close: () => void; onNew: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="command-modal modal-card"><button className="modal-close icon-button" onClick={close} aria-label="Close"><X size={18} /></button><span className="section-kicker">Quick actions</span><h2>What would you like to do?</h2><div className="command-list"><button onClick={onNew}><span className="command-icon blue"><Plus size={18} /></span><span><strong>Start a new report</strong><small>Capture a live session or upload a file</small></span><kbd>↵</kbd></button><button onClick={() => { close(); toast.info("Search focused"); document.querySelector<HTMLInputElement>(".search-wrap input")?.focus(); }}><span className="command-icon lilac"><Search size={18} /></span><span><strong>Search your workspace</strong><small>Find reports, people, and action items</small></span><kbd>/</kbd></button><button onClick={() => { close(); toast.info("Digest queued", { description: "We'll prepare your weekly mentorship digest." }); }}><span className="command-icon coral"><Download size={18} /></span><span><strong>Export weekly digest</strong><small>Share a snapshot of momentum</small></span><kbd>⌘ D</kbd></button></div></div></div>;
}

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const getViewFromPath = (path: string): ViewKey => {
    if (path.includes("reports")) return "reports";
    if (path.includes("sessions")) return "sessions";
    if (path.includes("actions") || path.includes("tasks")) return "actions";
    if (path.includes("people") || path.includes("mentees")) return "people";
    if (path.includes("analytics") || path.includes("progress")) return "analytics";
    if (path.includes("ai-assistant") || path.includes("assistant")) return "ai-assistant";
    if (path.includes("help")) return "help";
    return "overview";
  };

  const [activeView, setActiveView] = useState<ViewKey>(getViewFromPath(location.pathname));

  useEffect(() => {
    setActiveView(getViewFromPath(location.pathname));
  }, [location.pathname]);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | "open" | "done">("all");
  const [showNewReport, setShowNewReport] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showEditActionModal, setShowEditActionModal] = useState(false);
  const [showActionDetailsModal, setShowActionDetailsModal] = useState(false);
  const [selectedActionForView, setSelectedActionForView] = useState<ActionItem | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [generatedInvitationCode, setGeneratedInvitationCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [showConnectMentor, setShowConnectMentor] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joiningMentor, setJoiningMentor] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareReportId, setShareReportId] = useState<number | null>(null);
  const [shareReportTitle, setShareReportTitle] = useState<string>('');
  const [deleteCardReportId, setDeleteCardReportId] = useState<number | null>(null);
  const [deleteCardReportTitle, setDeleteCardReportTitle] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [reportTitle, setReportTitle] = useState("Weekly mentorship sync");
  const [reportMentee, setReportMentee] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedReportId, setGeneratedReportId] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role || localStorage.getItem('role') || 'mentor';
  const userName = user?.full_name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleWorkspaceMenu = () => {
    setShowWorkspaceMenu((open) => !open);
  };

  const handleProfileClick = () => {
    navigate(userRole === 'mentor' ? '/mentor/settings' : '/mentee/settings');
    setShowWorkspaceMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowWorkspaceMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showWorkspaceMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWorkspaceMenu]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!showWorkspaceMenu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showWorkspaceMenu]);

  const navItemsMentor: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "sessions", label: "Sessions", icon: AudioLines },
    { key: "actions", label: "Action items", icon: ListChecks },
    { key: "people", label: "People", icon: UsersRound },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
    { key: "ai-assistant", label: "AI Assistant", icon: BrainCircuit },
  ];

  const navItemsMentee: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "sessions", label: "Sessions", icon: AudioLines },
    { key: "actions", label: "Action items", icon: ListChecks },
    { key: "people", label: "Connect Mentor", icon: UsersRound },
    { key: "analytics", label: "Progress", icon: TrendingUp },
    { key: "ai-assistant", label: "AI Assistant", icon: BrainCircuit },
  ];

  const navItems = userRole === 'mentor' ? navItemsMentor : navItemsMentee;

  // Fetch meetings for the current user
  const { data: meetingsData } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const response = await api.get('/meetings/meetings');
      return response.data;
    },
    enabled: !authLoading && !!user,
  });

  // Fetch tasks for the current user
  const { data: tasksData } = useQuery({
  queryKey: ['tasks', userRole],
  queryFn: async () => {
    const endpoint = userRole === 'mentor' ? '/tasks/' : '/tasks/mentee';
    const response = await api.get(endpoint);
    return response.data;
  },
  enabled: !authLoading && !!user && (userRole === 'mentor' || userRole === 'mentee'),
});

  // Fetch mentees for mentor
  const { data: menteesData } = useQuery({
    queryKey: ['mentees'],
    queryFn: async () => {
      const response = await api.get('/assignments/my-mentees');
      return response.data;
    },
    enabled: !authLoading && !!user && userRole === 'mentor',
  });

  // Fetch mentor for mentee
  const { data: myMentorData } = useQuery({
    queryKey: ['my-mentor'],
    queryFn: async () => {
      const response = await api.get('/assignments/my-mentor');
      return response.data;
    },
    enabled: !authLoading && !!user && userRole === 'mentee',
  });

  useEffect(() => {
    if (meetingsData) setMeetings(meetingsData);
  }, [meetingsData]);

  useEffect(() => {
    if (tasksData) setTasks(tasksData);
  }, [tasksData]);

  useEffect(() => {
    if (menteesData) setMentees(menteesData);
  }, [menteesData]);

  // Fetch reports from backend
  const { data: reportsData } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await api.get('/reports');
      return response.data;
    },
    enabled: !authLoading && !!user,
  });

  useEffect(() => {
    if (reportsData) {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  }, [reportsData, queryClient]);

  // Transform backend data to match UI types
  const reports: Report[] = useMemo(() => {
    if (reportsData && reportsData.length > 0) {
      return reportsData.map((r: any, index: number) => {
        const mentee = mentees.find(m => m.id === r.mentee_id);
        const tones = ["blue", "peach", "lavender"];
        const statuses: ("Ready" | "Draft" | "Processing")[] = ["Ready", "Draft", "Processing"];
        const statusMap: Record<string, "Ready" | "Draft" | "Processing"> = {
          "approved": "Ready",
          "shared": "Ready",
          "draft": "Draft",
          "pending_review": "Processing",
        };
        return {
          id: r.id,
          title: r.report_content?.meeting_details?.meeting_title || `Report ${r.id}`,
          mentee: mentee?.full_name || `Mentee ${r.mentee_id}`,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown",
          duration: "42 min",
          status: statusMap[r.status] || statuses[index % statuses.length],
          tone: tones[index % tones.length],
          initials: mentee?.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "AM",
          reportContent: r.report_content,
        };
      });
    }
    // Fallback to meetings without reports
    return meetings.map((meeting, index) => {
      const mentee = mentees.find(m => m.id === meeting.mentee_id);
      const tones = ["blue", "peach", "lavender"];
      const statuses: ("Ready" | "Draft" | "Processing")[] = ["Ready", "Ready", "Draft"];
      return {
        id: meeting.id,
        title: meeting.meeting_title,
        mentee: mentee?.full_name || `Mentee ${meeting.mentee_id}`,
        date: meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown",
        duration: "42 min",
        status: statuses[index % statuses.length],
        tone: tones[index % tones.length],
        initials: mentee?.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "AM",
      };
    });
  }, [reportsData, meetings, mentees]);

  const baseActions: ActionItem[] = useMemo(() => {
    return tasks.map((task, index) => {
      const mentee = mentees.find(m => m.id === task.mentee_id);
      const owners = mentee ? [mentee.full_name, "You"] : ["Mentee", "You"];
      const priorities: ("High" | "Medium" | "Low" | "Critical")[] = ["High", "Medium", "Low", "Critical"];
      const statuses: ActionStatus[] = ["open", "open", "done", "open"];
      const dueDates = ["Today", "Tomorrow", "Nov 14", "Nov 16"];
      return {
        id: task.id,
        title: task.title,
        owner: owners[index % owners.length],
        due: dueDates[index % dueDates.length],
        priority: priorities[Math.min(index, priorities.length - 1)],
        status: task.status === "completed" ? "done" : statuses[index % statuses.length],
        fullData: task,
      };
    });
  }, [tasks, mentees]);

  // Calculate real metrics from backend data
  const totalReportsCount = useMemo(() => {
    return reports.filter(report => report.status === "Ready").length;
  }, [reports]);

  const draftReportsCount = useMemo(() => {
    return reports.filter(report => report.status === "Draft").length;
  }, [reports]);

  const processingReportsCount = useMemo(() => {
    return reports.filter(report => report.status === "Processing").length;
  }, [reports]);

  const totalActionsCount = useMemo(() => {
    return baseActions.filter(action => action.status === "open").length;
  }, [baseActions]);

  // Overview dashboard metrics derived from real data
  const dashboardMetrics = useMemo(() => {
    const totalMentees = mentees.length;
    const reportsCreated = reports.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
    const openActions = baseActions.filter(a => a.status === "open").length;
    const doneActions = baseActions.filter(a => a.status === "done").length;
    const totalActions = baseActions.length;
    const actionCompletionRate = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0;
    const goalCompletionRate = totalActions > 0 ? actionCompletionRate : 0;
    const activeNextStepMentees = mentees.filter(m => {
      return tasks.some(t => t.mentee_id === m.id && (t.status === "pending" || t.status === "in_progress"));
    }).length;
    const menteeProgressRate = totalMentees > 0 ? Math.round((activeNextStepMentees / totalMentees) * 100) : 0;
    const goalsOnTrack = Math.round((completedTasks / Math.max(totalActions, 1)) * 100);

    return {
      totalMentees,
      reportsCreated,
      pendingTasks,
      completedTasks,
      openActions,
      doneActions,
      totalActions,
      actionCompletionRate,
      menteeProgressRate,
      goalsOnTrack,
      goalCompletionRate,
    };
  }, [mentees, reports, tasks, baseActions]);

  // Data-driven spotlight: find mentees needing attention
  const spotlightMentees = useMemo(() => {
    return mentees
      .map(m => {
        const menteeTasks = tasks.filter(t => t.mentee_id === m.id);
        const overdueTasks = menteeTasks.filter(t => t.status === "overdue" || (t.status === "pending" && t.deadline && new Date(t.deadline) < new Date()));
        const pendingTasks = menteeTasks.filter(t => t.status === "pending" || t.status === "in_progress");
        const completedTasks = menteeTasks.filter(t => t.status === "completed");
        const totalTasks = menteeTasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
        const lastMeeting = meetings
          .filter(mt => mt.mentee_id === m.id)
          .sort((a, b) => new Date(b.meeting_date || 0).getTime() - new Date(a.meeting_date || 0).getTime())[0];

        return {
          ...m,
          overdueCount: overdueTasks.length,
          pendingCount: pendingTasks.length,
          completedCount: completedTasks.length,
          completedTasks: completedTasks.length,
          totalTasks,
          completionRate,
          lastMeeting: lastMeeting ? new Date(lastMeeting.meeting_date || 0) : null,
          needsAttention: overdueTasks.length > 0 || (completionRate < 50 && totalTasks > 0),
        };
      })
      .sort((a, b) => {
        if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
        return a.overdueCount - b.overdueCount;
      });
  }, [mentees, tasks, meetings]);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const query = search.toLowerCase();
    return !query || `${report.title} ${report.mentee}`.toLowerCase().includes(query);
  }), [reports, search]);

  const filteredActions = useMemo(() => baseActions.filter((item) => {
    const matchesFilter = actionFilter === "all" || item.status === actionFilter;
    const query = search.toLowerCase();
    return matchesFilter && (!query || `${item.title} ${item.owner}`.toLowerCase().includes(query));
  }), [baseActions, actionFilter, search]);

  const toggleAction = (id: number) => {
    const action = baseActions.find(a => a.id === id);
    if (!action) return;
    // Mentees cannot change status directly - they must use completion modes
    if (userRole === "mentee") {
      toast.info("Use the task details view to complete this action");
      return;
    }
    const newStatus = action.status === "done" ? "pending" : "completed";
    api.put(`/tasks/${id}`, { status: newStatus }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Action item updated", { description: "Your progress has been saved to this workspace." });
    }).catch(() => {
      toast.error("Failed to update", { description: "Could not update action item." });
    });
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first", { description: "You need to upload a transcript, audio, or video file." });
      return;
    }
    if (!reportTitle.trim()) {
      toast.error("Please enter a session title", { description: "The session title is required for report generation." });
      return;
    }

    let menteeId: number | undefined;
    if (userRole === "mentor") {
      if (!reportMentee) {
        toast.error("Please select a mentee", { description: "A mentee must be selected for the report." });
        return;
      }
      const menteeObj = mentees.find(m => m.full_name === reportMentee);
      if (!menteeObj) {
        toast.error("Invalid mentee selected", { description: "Please select a valid mentee from the list." });
        return;
      }
      menteeId = menteeObj.id;
    } else {
      menteeId = Number(user?.id);
      if (!Number.isFinite(menteeId) || menteeId <= 0) {
        toast.error("Unable to identify your account", { description: "Please sign in again and retry." });
        return;
      }
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("files", selectedFile);
      formData.append("mentee_id", String(menteeId));
      formData.append("meeting_title", reportTitle.trim());
      formData.append("meeting_date", new Date().toISOString());

      let createMeetingUrl: string;
      let generateReportUrl: (meetingId: number | string) => string;
      if (userRole === "mentee") {
        createMeetingUrl = "/meetings/mentee/create-meeting";
        generateReportUrl = (meetingId) => `/meetings/mentee/generate-report/${meetingId}`;
      } else {
        formData.append("mentor_id", String(user?.id));
        createMeetingUrl = "/meetings/create-meeting";
        generateReportUrl = (meetingId) => `/meetings/generate-report/${meetingId}`;
      }

      const response = await api.post(createMeetingUrl, formData);
      const meetingId = response.data?.meeting_id ?? response.data?.id;
      if (!meetingId) throw new Error("Meeting was created but the server did not return a meeting ID.");

      await api.post(generateReportUrl(meetingId));

      setGenerated(true);
      setGeneratedReportId(response.data?.report_id ?? null);
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report ready", { description: "Men.AI turned your conversation into a structured report." });
    } catch (err: any) {
      toast.error("Report generation failed", { description: err.response?.data?.detail || err.message || "Failed to generate report. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  };

  const openNewReport = () => {
    setGenerated(false);
    setGeneratedReportId(null);
    setIsGenerating(false);
    setSelectedFile(null);
    if (mentees.length > 0 && !reportMentee) {
      setReportMentee(mentees[0].full_name);
    }
    setShowNewReport(true);
  };

  // Open the freshly generated report in the report preview.
  const openGeneratedReport = (reportId: number | null) => {
    if (!reportId) return;
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
    } else {
      // The report list may not have refreshed yet; fetch it directly.
      api
        .get(`/reports/${reportId}`)
        .then((response) => {
          const r = response.data;
          const mentee = mentees.find((m) => m.id === r.mentee_id);
          setSelectedReport({
            id: r.id,
            title: r.report_content?.meeting_details?.meeting_title || `Report ${r.id}`,
            mentee: mentee?.full_name || `Mentee ${r.mentee_id}`,
            date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown",
            duration: "42 min",
            status: "Ready",
            tone: "blue",
            initials: mentee?.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || "AM",
            reportContent: r.report_content,
          });
        })
        .catch(() => {
          toast.error("Failed to open report", { description: "Could not load the generated report." });
        });
    }
  };

  // Share the freshly generated report using the existing report-sharing endpoint.
  const shareGeneratedReport = (reportId: number) => {
    if (!reportId) return;

    api
      .post(`/reports/${reportId}/share`, {})
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast.success("Report shared", { description: "A secure share link has been copied." });
      })
      .catch((shareError: any) => {
        const detail = shareError?.response?.data?.detail;
        toast.error("Failed to share report", { description: detail || "Could not share the report. Please try again." });
      });
  };

  const closeNewReport = () => {
    setShowNewReport(false);
    setGenerated(false);
    setIsGenerating(false);
    setSelectedFile(null);
  };

  const selectView = (view: ViewKey) => {
    setActiveView(view);
    setShowMobileNav(false);
    if (userRole === 'mentor') {
      navigate(`/mentor/${view}`);
    } else {
      navigate(`/mentee/${view}`);
    }
  };

  const handleActionEdit = (actionItem: ActionItem) => {
    // Only mentors can edit tasks
    if (userRole !== "mentor") return;
    if (actionItem.fullData) {
      setSelectedActionForEdit(actionItem.fullData);
      setShowEditActionModal(true);
    }
  };

  const handleActionDelete = async (actionItem: ActionItem) => {
    // Only mentors can delete tasks
    if (userRole !== "mentor") return;
    if (window.confirm("Are you sure you want to delete this action item? This cannot be undone.")) {
      try {
        await api.delete(`/tasks/${actionItem.id}`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast.success("Action item deleted successfully");
      } catch (err) {
        toast.error("Failed to delete action item");
      }
    }
  };

  const handleActionViewDetails = (actionItem: ActionItem) => {
    setSelectedActionForView(actionItem);
    setShowActionDetailsModal(true);
  };

  // Invitation code handlers
  const handleGenerateInvitation = async () => {
    if (userRole !== "mentor") return;

    setIsGeneratingCode(true);
    try {
      const response = await api.post("/assignments/generate-code", {
        max_uses: 1,
        expires_in_days: 7
      });
      const code = response.data?.code;
      if (code) {
        setGeneratedInvitationCode(code);
        toast.success("Invitation code generated", {
          description: "Share this code with your mentee. It expires in 7 days."
        });
      } else {
        toast.error("Failed to generate code", { description: "No code returned from server." });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Failed to generate invitation code";
      toast.error("Failed to generate code", { description: detail });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCloseInvitation = () => {
    setGeneratedInvitationCode(null);
  };

  const handleCopyCode = async () => {
  if (!generatedInvitationCode) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(generatedInvitationCode);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedInvitationCode;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (!copied) {
        throw new Error("Clipboard copy failed");
      }
    }

    setIsCodeCopied(true);

    setTimeout(() => {
      setIsCodeCopied(false);
    }, 2000);

    toast.success("Invitation code copied!", {
      description: "You can now share the code with your mentee.",
    });
  } catch (error) {
    toast.error("Unable to copy code. Please select and copy it manually.");
  }
};

  // Connect Mentor handlers
  const handleJoinMentor = async () => {
    if (!joinCode.trim() || joiningMentor) return;

    setJoiningMentor(true);
    try {
      const response = await api.post("/assignments/join", { code: joinCode.trim() });
      setJoinCode("");
      setShowConnectMentor(false);
      toast.success("Successfully connected to mentor!", {
        description: "You are now assigned to this mentor.",
      });
      queryClient.invalidateQueries({ queryKey: ['my-mentor'] });
      queryClient.invalidateQueries({ queryKey: ['mentees'] });
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Failed to join mentor";
      if (detail.includes("already assigned")) {
        toast.error("Already connected to a mentor", {
          description: detail,
        });
      } else if (detail.includes("Invalid or inactive") || detail.includes("expired")) {
        toast.error("Invalid invitation code", {
          description: "The code is invalid, expired, or has reached its usage limit.",
        });
      } else if (detail.includes("usage limit")) {
        toast.error("Code usage limit reached", {
          description: "This invitation code has already been used the maximum number of times.",
        });
      } else {
        toast.error("Failed to connect", { description: detail });
      }
    } finally {
      setJoiningMentor(false);
    }
  };

  const handleCloseConnectMentor = () => {
    setShowConnectMentor(false);
    setJoinCode("");
  };

  // Delete report from card menu
  const deleteReportMutation = useMutation({
    mutationKey: ['delete-report-from-card'],
    mutationFn: async (reportId: number) => {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    },
    onSuccess: (_data, reportId) => {
      const title = reports.find((r) => r.id === reportId)?.title || 'Report';
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Report deleted', {
        description: `"${title}" has been permanently deleted.`,
      });
    },
    onError: (deleteError: unknown) => {
      const detail =
        (deleteError as any)?.response?.data?.detail ||
        (deleteError as Error)?.message ||
        'Failed to delete report. Please try again.';
      toast.error('Failed to delete report', { description: detail });
    },
  });

  const [selectedActionForEdit, setSelectedActionForEdit] = useState<any>(null);

  if (authLoading) {
    return <div className="menai-shell"><main className="main-canvas" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh'}}><div>Loading...</div></main></div>;
  }

  return (
    <div className="menai-shell">
      <aside className={`side-rail ${showMobileNav ? "rail-open" : ""}`}>
        <div className="brand-lockup" onClick={() => selectView("overview")}>
          <LogoMark />
          <span>Men<span className="brand-dot">.</span>AI</span>
        </div>
        <div ref={workspaceMenuRef} className={`workspace-menu-wrapper ${showWorkspaceMenu ? 'open' : ''}`}>
          <button
            type="button"
            className="workspace-switcher"
            onClick={toggleWorkspaceMenu}
            aria-label="Workspace options"
            aria-expanded={showWorkspaceMenu}
          >
            <Avatar initials={userInitials} tone="navy" size="sm" />
            <span>
              <small>Workspace</small>
              <strong>{userName}'s practice</strong>
            </span>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${showWorkspaceMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showWorkspaceMenu && (
            <div className="action-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="dropdown-item"
                onClick={handleProfileClick}
              >
                <User size={16} />
                Profile
              </button>

              <button
                type="button"
                className="dropdown-item danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
        <div className="rail-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ key, label, icon: Icon, badge }) => (
            <button key={key} className={`nav-item ${activeView === key ? "nav-active" : ""}`} onClick={() => selectView(key)}>
              <Icon size={18} strokeWidth={activeView === key ? 2.2 : 1.8} />
              <span>{label}</span>
              {badge && <em>{badge}</em>}
            </button>
          ))}
        </nav>
        <div className="rail-label rail-label-lower">Manage</div>
        <nav className="main-nav">
          <button className="nav-item" onClick={() => navigate(userRole === 'mentor' ? '/mentor/settings' : '/mentee/settings')}><Settings2 size={18} /><span>Settings</span></button>
          <button className="nav-item" onClick={() => selectView("help")}><Circle size={18} /><span>Help center</span></button>
        </nav>
        <div className="rail-bottom">
          <div className="ai-mini-card">
            <span className="ai-mini-icon"><Sparkles size={15} /></span>
            <strong>AI usage</strong>
            <small>72% of monthly credits</small>
            <div className="usage-bar"><span style={{ width: "72%" }} /></div>
          </div>
          <button className="profile-chip" onClick={() => { logout(); navigate('/login'); }}>
            <Avatar initials={userInitials} tone="coral" size="sm" />
            <span><strong>{userName}</strong><small>{userRole.charAt(0).toUpperCase() + userRole.slice(1)} · Logout</small></span>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setShowMobileNav((open) => !open)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Men.AI</span><ChevronRight size={15} /><strong>{navCopy[activeView].title.split(" ").slice(0, 2).join(" ")}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => navigate(userRole === 'mentor' ? '/mentor/notifications' : '/mentee/notifications')}><Bell size={18} /><i /></button>
            <button className="new-report-button" onClick={openNewReport}><Plus size={17} /><span>New report</span></button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">{navCopy[activeView].eyebrow}</p>
              <h1>{activeView === "overview" ? `Good morning, ${userName.split(' ')[0]}` : navCopy[activeView].title}</h1>
              <p className="page-description">{navCopy[activeView].description}</p>
            </div>
            {activeView === "overview" && (
  <div className="heading-actions">
    <button className="primary-button" onClick={openNewReport}>
      <Plus size={17} /> Capture a session
    </button>
  </div>
)}
          </section>

          {activeView === "overview" && (
            <>
              <section className="hero-grid">
                <div className="capture-card">
                  <div className="capture-glow" />
                  <div className="capture-topline"><span className="live-dot" /> Men.AI is ready when you are <span className="capture-time">Last sync 8 min ago</span></div>
                  <div className="capture-content">
                    <div>
                      <p className="eyebrow light">AI meeting intelligence</p>
                      <h2>Turn conversations<br />into <em>momentum.</em></h2>
                      <p>Capture the nuance of your mentorship sessions. Men.AI handles the notes, so you can stay present.</p>
                      <div className="capture-actions"><button className="white-button" onClick={openNewReport}><Mic2 size={17} /> Start a session</button><button className="ghost-light-button" onClick={openNewReport}><UploadCloud size={17} /> Upload transcript</button></div>
                    </div>
                    <div className="capture-orb" aria-hidden="true"><div className="orb-ring orb-ring-one" /><div className="orb-ring orb-ring-two" /><BrainCircuit size={47} /></div>
                  </div>
                </div>
                <div className="progress-card surface-card">
                  <div className="card-heading"><div><span className="section-kicker">Practice pulse</span><h3>Progress this week</h3></div><button className="icon-button subtle"><MoreHorizontal size={18} /></button></div>
                  <div className="progress-number"><strong>{dashboardMetrics.menteeProgressRate}<span>%</span></strong><Pill tone="up"><TrendingUp size={13} /> {dashboardMetrics.menteeProgressRate}%</Pill></div>
                  <p className="muted-copy">of your mentees have an active next step</p>
                  <MiniTrend />
                  <div className="progress-foot"><span><i className="legend-dot blue" /> Goals on track</span><strong>{dashboardMetrics.completedTasks} / {dashboardMetrics.totalActions}</strong></div>
                </div>
              </section>

              <section className="metric-strip">
                <div className="metric-item"><span className="metric-icon metric-blue"><FileText size={17} /></span><span><small>Reports created</small><strong>{dashboardMetrics.reportsCreated}</strong></span></div>
                <div className="metric-item"><span className="metric-icon metric-coral"><Target size={17} /></span><span><small>Goals completed</small><strong>{dashboardMetrics.goalCompletionRate}%</strong></span></div>
                <div className="metric-item"><span className="metric-icon metric-lilac"><Clock3 size={17} /></span><span><small>Active mentees</small><strong>{dashboardMetrics.totalMentees}</strong></span></div>
                <div className="metric-item metric-tip"><Zap size={18} /><span><strong>{dashboardMetrics.doneActions} commitments</strong><small>closed this week</small></span><ArrowUpRight size={16} /></div>
              </section>

              <section className="content-grid">
                <div className="wide-column">
                  <div className="section-heading"><div><span className="section-kicker">Keep an eye on</span><h2>Recent reports</h2></div><button className="text-button" onClick={() => selectView("reports")}>View library <ArrowUpRight size={15} /></button></div>
                  <div className="surface-card reports-card">
                    <div className="reports-toolbar">
                      <span>3 most recent conversations</span>
                    </div>
                    <div className="report-list">{filteredReports.slice(0, 3).map((report) => <ReportRow key={report.id} report={report} onOpen={setSelectedReport} />)}</div>
                  </div>
                  <div className="section-heading section-heading-actions"><div><span className="section-kicker">Shared accountability</span><h2>Action items</h2></div><button className="text-button" onClick={() => selectView("actions")}>View all <ArrowUpRight size={15} /></button></div>
                  <div className="surface-card actions-card">
                    <div className="action-progress"><div><strong>{dashboardMetrics.openActions} active commitments</strong><span>Keep the small promises moving.</span></div><div className="thin-progress"><span style={{ width: `${dashboardMetrics.actionCompletionRate}%` }} /></div><b>{dashboardMetrics.actionCompletionRate}%</b></div>
                    {baseActions.slice(0, 3).map((item) => <ActionRow key={item.id} item={item} onToggle={toggleAction} onEdit={handleActionEdit} onDelete={handleActionDelete} userRole={userRole} onViewDetails={handleActionViewDetails} />)}
                  </div>
                </div>
                <aside className="right-column">
                  <div className="section-heading"><div><span className="section-kicker">Mentee spotlight</span><h2>Needs attention</h2></div><button className="icon-button subtle"><MoreHorizontal size={18} /></button></div>
                  <div className="surface-card spotlight-card">
                    {spotlightMentees.length > 0 ? (
                      <>
                        <div className="spotlight-head"><Avatar initials={spotlightMentees[0].full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)} tone="blue" size="lg" /><span><strong>{spotlightMentees[0].full_name}</strong><small>{spotlightMentees[0].email}</small></span><span className="status-pulse" /></div>
                        <div className="spotlight-divider" />
                        <div className="spotlight-goal"><div className="goal-icon"><Flag size={16} /></div><span><small>Current focus</small><strong>{spotlightMentees[0].totalTasks > 0 ? `${spotlightMentees[0].completedTasks} of ${spotlightMentees[0].totalTasks} tasks completed` : 'No tasks assigned yet'}</strong></span><Pill tone={spotlightMentees[0].needsAttention ? "attention" : "ready"}>{spotlightMentees[0].needsAttention ? "Needs focus" : "On track"}</Pill></div>
                        <div className="goal-progress"><span><i style={{ width: `${spotlightMentees[0].completionRate}%` }} /></span><small>{spotlightMentees[0].completionRate}% complete</small></div>
                        <p className="spotlight-note"><Sparkles size={14} /> {spotlightMentees[0].overdueCount > 0 ? `AI noticed ${spotlightMentees[0].overdueCount} overdue task(s).` : 'Keep up the good work!'}</p>
                        <button className="outline-button" onClick={() => { const menteeReport = reports.find(r => r.mentee === spotlightMentees[0].full_name); if (menteeReport) setSelectedReport(menteeReport); else toast.info("No reports available for this mentee yet"); }}>Review context <ChevronRight size={15} /></button>
                      </>
                    ) : (
                      <div className="spotlight-empty">
                        <UsersRound size={32} style={{ opacity: 0.3, margin: '16px auto' }} />
                        <p style={{ textAlign: 'center', color: '#6a7a92' }}>No mentees assigned yet</p>
                      </div>
                    )}
                  </div>
                  <div className="surface-card goal-card"><div className="card-heading"><div><span className="section-kicker">Your practice</span><h3>Goals at a glance</h3></div><ProgressRing value={dashboardMetrics.goalCompletionRate} /></div><div className="goal-list">
                    {tasks.length > 0 ? (
                      <>
                        <div><span className="goal-check green"><Check size={13} /></span><span><strong>Completed</strong><small>On track</small></span><b>{dashboardMetrics.completedTasks}</b></div>
                        <div><span className="goal-check orange"><Clock3 size={13} /></span><span><strong>Pending</strong><small>Needs attention</small></span><b>{dashboardMetrics.pendingTasks}</b></div>
                        <div><span className="goal-check blue"><Target size={13} /></span><span><strong>Total tasks</strong><small>Across all mentees</small></span><b>{tasks.length}</b></div>
                      </>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#6a7a92', padding: '12px' }}>No tasks created yet</p>
                    )}
                  </div></div>
                  <div className="ai-tip"><div className="tip-icon"><WandSparkles size={17} /></div><span><strong>AI tip for you</strong><small>Try ending your next session with one "show me" commitment.</small></span><ChevronRight size={16} /></div>
                </aside>
              </section>
            </>
          )}

          {activeView === "reports" && (
          <ReportsView
            reports={filteredReports}
            onOpen={setSelectedReport}
            onNew={openNewReport}
            onCardShare={(reportId, title) => {
              setShareReportId(reportId);
              setShareReportTitle(title);
            }}
            onCardDelete={(reportId, title) => {
              setDeleteCardReportId(reportId);
              setDeleteCardReportTitle(title);
            }}
          />
        )}
          {activeView === "sessions" && (
            <SessionsView
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onNew={openNewReport}
              onReportOpen={openGeneratedReport}
            />
          )}
          {activeView === "actions" && <ActionsView actions={filteredActions} filter={actionFilter} setFilter={setActionFilter} onToggle={toggleAction} onAdd={() => setShowAddAction(true)} onEdit={handleActionEdit} onDelete={handleActionDelete} userRole={userRole} onViewDetails={handleActionViewDetails} />}
          {activeView === "people" && userRole === "mentor" && <PeopleView
            onOpen={setSelectedReport}
            reports={reports}
            mentees={mentees}
            onGenerateInvitation={handleGenerateInvitation}
            isGeneratingCode={isGeneratingCode}
            generatedInvitationCode={generatedInvitationCode}
            onCloseInvitation={handleCloseInvitation}
            onCopyCode={handleCopyCode}
          />}
          {activeView === "people" && userRole === "mentee" && (
            <div className="view-stack">
              <div className="people-header surface-card">
                <div>
                  <span className="section-kicker">Mentor connection</span>
                  <h2>Connect with your mentor</h2>
                  <p>Enter an invitation code to join a mentor's mentorship.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setShowConnectMentor(true)}
                >
                  <Plus size={17} /> Connect Mentor
                </button>
              </div>
              <div className="people-grid">
                {myMentorData ? (
                  <div className="person-card surface-card" style={{ gridColumn: '1 / -1', maxWidth: '400px' }}>
                    <div className="person-top">
                      <Avatar
                        initials={myMentorData.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'M'}
                        tone="blue"
                        size="lg"
                      />
                      <Pill tone="ready">Connected</Pill>
                    </div>
                    <strong>{myMentorData.full_name}</strong>
                    <small>{myMentorData.email}</small>
                    <div style={{ marginTop: '16px', padding: '12px', background: '#f4f7fb', borderRadius: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#6a7a92', margin: 0 }}>
                        You are connected to this mentor. All your reports and tasks will be shared with them.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="people-empty" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px' }}>
                    <UsersRound size={32} style={{ opacity: 0.3, margin: '16px auto' }} />
                    <p style={{ color: '#6a7a92', marginBottom: '16px' }}>No mentor assigned yet</p>
                    <button className="primary-button" onClick={() => setShowConnectMentor(true)}>
                      <Plus size={17} /> Connect Mentor
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeView === "analytics" && userRole === "mentor" && (
          <AnalyticsView
            mentees={mentees}
            tasks={tasks}
            meetings={meetings}
            reports={reportsData || []}
            userRole={userRole}
          />
        )}
        {activeView === "analytics" && userRole === "mentee" && (
          <MenteeProgress />
        )}
          {activeView === "ai-assistant" && <AIAssistantView />}
          {activeView === "help" && <HelpCenterView />}
        </div>
      </main>

      {showNewReport && <NewReportModal close={closeNewReport} title={reportTitle} setTitle={setReportTitle} mentee={reportMentee} setMentee={setReportMentee} mentees={mentees} selectedFile={selectedFile} setSelectedFile={setSelectedFile} isGenerating={isGenerating} generated={generated} generate={handleGenerate} onOpen={openGeneratedReport} onShare={shareGeneratedReport} reportId={generatedReportId} userRole={userRole} />}
      {userRole === "mentor" && showAddAction && <AddActionModal close={() => setShowAddAction(false)} onAdd={(data) => {
        // For mentors, mentee_id is required. If "You" is selected, default to first mentee.
        const menteeIdForBackend = data.menteeId || mentees[0]?.id;

        const payload = {
          title: data.title,
          description: data.description,
          assigned_to: data.assignedTo,
          related_meeting: data.relatedMeeting,
          priority: data.priority.toLowerCase(),
          status: data.status.toLowerCase().replace(' ', '_'),
          due_date: data.dueDate || null,
          category: data.category,
          notes: data.notes,
          require_file_upload: data.requireFileUpload,
          mentee_id: menteeIdForBackend,
        };
        api.post("/tasks/", payload).then(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success("Action item added");
        }).catch((err) => {
          toast.error("Failed to add action item");
        });
      }} mentees={mentees} />}
      {userRole === "mentor" && showEditActionModal && (
        <AddActionModal
          close={() => setShowEditActionModal(false)}
          onAdd={(data) => {
            if (selectedActionForEdit) {
              const payload = {
                title: data.title,
                description: data.description,
                assigned_to: data.assignedTo,
                related_meeting: data.relatedMeeting,
                priority: data.priority.toLowerCase(),
                status: data.status.toLowerCase().replace(' ', '_'),
                due_date: data.dueDate || null,
                category: data.category,
                notes: data.notes,
                require_file_upload: data.requireFileUpload,
              };
              api.put(`/tasks/${selectedActionForEdit.id}`, payload).then(() => {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                toast.success("Action item updated");
                setShowEditActionModal(false);
                setSelectedActionForEdit(null);
              }).catch((err) => {
                toast.error("Failed to update action item");
              });
            }
          }}
          defaultData={selectedActionForEdit}
          mentees={mentees}
        />
      )}
      {showActionDetailsModal && selectedActionForView && (
        <ActionDetailsModal
          close={() => setShowActionDetailsModal(false)}
          action={selectedActionForView}
          userRole={userRole}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setShowActionDetailsModal(false);
            setSelectedActionForView(null);
          }}
        />
      )}
      {selectedReport && <ReportPreview report={selectedReport} close={() => setSelectedReport(null)} onRefine={() => toast.success("Section refined", { description: "Men.AI polished the summary while keeping your meaning intact." })} onOpenShare={() => setShowShareOptions(true)} queryClient={queryClient} />}

      {selectedReport && (
        <ShareOptions
          open={showShareOptions}
          reportId={selectedReport.id}
          reportTitle={selectedReport.title}
          onClose={() => setShowShareOptions(false)}
          onShared={() => {
            setShowShareOptions(false);
            queryClient.invalidateQueries({ queryKey: ["reports"] });
          }}
        />
      )}

      {/* Share options popup for card menu */}
      {shareReportId !== null && (
        <ShareOptions
          open={shareReportId !== null}
          reportId={shareReportId}
          reportTitle={shareReportTitle}
          onClose={() => {
            setShareReportId(null);
            setShareReportTitle('');
          }}
          onShared={() => {
            setShareReportId(null);
            setShareReportTitle('');
            queryClient.invalidateQueries({ queryKey: ["reports"] });
          }}
        />
      )}

      {/* Delete confirmation dialog for card menu */}
      {deleteCardReportId !== null && (
        <DeleteConfirm
          open={deleteCardReportId !== null}
          title="Delete report"
          message={
            deleteCardReportTitle
              ? `"${deleteCardReportTitle}" and all of its versions will be permanently deleted. This action cannot be undone.`
              : 'This report and all of its versions will be permanently deleted. This action cannot be undone.'
          }
          isPending={deleteReportMutation.isPending}
          onClose={() => {
            setDeleteCardReportId(null);
            setDeleteCardReportTitle('');
          }}
          onConfirm={() => {
            if (deleteCardReportId !== null) {
              deleteReportMutation.mutate(deleteCardReportId);
              setDeleteCardReportId(null);
              setDeleteCardReportTitle('');
            }
          }}
        />
      )}

      <button className="command-hint" onClick={() => setShowCommand(true)}><Sparkles size={14} /> Press <kbd>⌘ K</kbd> to capture</button>
      {showCommand && <CommandModal close={() => setShowCommand(false)} onNew={() => { setShowCommand(false); openNewReport(); }} />}
      {showConnectMentor && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) handleCloseConnectMentor(); }}>
          <div className="modal-card new-report-modal" style={{ maxWidth: '480px' }}>
            <button className="modal-close icon-button" onClick={handleCloseConnectMentor} aria-label="Close">
              <X size={18} />
            </button>
            <div className="modal-icon">
              <UsersRound size={21} />
            </div>
            <span className="section-kicker">Connect with mentor</span>
            <h2>Enter invitation code</h2>
            <p>Your mentor should have shared an invitation code with you. Enter it below to join their mentorship.</p>

            <label style={{ display: 'block', marginTop: '24px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#15233e' }}>
                Invitation Code
              </span>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '18px',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  border: '1px solid #d0d8e2',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: '#fff',
                  color: '#15233e',
                  boxSizing: 'border-box'
                }}
                maxLength={12}
                disabled={joiningMentor}
                autoFocus
              />
            </label>

            <p style={{ fontSize: '13px', color: '#6a7a92', textAlign: 'center', marginTop: '16px' }}>
              The code is case-insensitive and expires after 7 days.
            </p>

            <div className="generated-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="secondary-button"
                onClick={handleCloseConnectMentor}
                disabled={joiningMentor}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="primary-button modal-submit"
                onClick={handleJoinMentor}
                disabled={joiningMentor || !joinCode.trim()}
                style={{ flex: 1 }}
              >
                {joiningMentor ? (
                  <>
                    <RefreshCw size={17} className="spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <UsersRound size={17} /> Join Mentor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}