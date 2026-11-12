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
  UploadCloud,
  UsersRound,
  WandSparkles,
  X,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

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
  priority: "High" | "Medium" | "Low";
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
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "overdue";
  mentee_id: number;
};

type Mentee = {
  id: number;
  full_name: string;
  email: string;
  assigned_at: string;
};


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

function ActionRow({ item, onToggle, onEdit, onDelete }: { item: ActionItem; onToggle: (id: number) => void; onEdit: (item: ActionItem) => void; onDelete: (item: ActionItem) => void }) {
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

  return (
    <div className={`action-row ${item.status === "done" ? "action-done" : ""}`}>
      <button className="action-check" aria-label={`Mark ${item.title} ${item.status === "done" ? "open" : "complete"}`} onClick={() => onToggle(item.id)}>
        {item.status === "done" ? <Check size={14} strokeWidth={3} /> : <Circle size={18} strokeWidth={1.5} />}
      </button>
      <span className="action-copy">
        <strong>{item.title}</strong>
        <small><span className="owner-dot" /> {item.owner} <span>·</span> due {item.due}</small>
      </span>
      <Pill tone={item.priority.toLowerCase()}>{item.priority}</Pill>
      <div className="action-menu" ref={menuRef}>
        <button className="icon-button subtle" aria-label="More action options" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <MoreHorizontal size={17} />
        </button>
        {menuOpen && (
          <div className="action-menu-dropdown">
            <button className="dropdown-item" onClick={() => { setMenuOpen(false); onEdit(item); }}>
              <Edit3 size={15} /> Edit
            </button>
            <button className="dropdown-item danger" onClick={() => { setMenuOpen(false); onDelete(item); }}>
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsView({ reports, onOpen, onNew }: { reports: Report[]; onOpen: (report: Report) => void; onNew: () => void }) {
  const readyReportsCount = reports.filter(report => report.status === "Ready").length;
  const draftReportsCount = reports.filter(report => report.status === "Draft").length;
  const processingReportsCount = reports.filter(report => report.status === "Processing").length;
  const totalReportsCount = reports.length;

  return <div className="view-stack"><div className="library-summary"><div className="library-summary-main"><div className="summary-icon"><FileText size={21} /></div><span><strong>{totalReportsCount} reports</strong><small>Across active mentorships</small></span></div><div className="summary-stats"><span><strong>{readyReportsCount}</strong><small>Ready to share</small></span><span><strong>{draftReportsCount}</strong><small>Drafts</small></span><span><strong>{processingReportsCount}</strong><small>Processing</small></span></div><button className="primary-button" onClick={onNew}><Plus size={17} /> New report</button></div><div className="library-toolbar surface-card"><div className="library-tabs"><button className="library-tab active">All reports <span>{totalReportsCount}</span></button><button className="library-tab">Ready <span>{readyReportsCount}</span></button><button className="library-tab">Drafts <span>{draftReportsCount}</span></button></div><button className="filter-button"><SlidersHorizontal size={14} /> Sort: newest <ChevronDown size={14} /></button></div><div className="report-library-grid">{reports.map((report) => <button className="library-report surface-card" key={report.id} onClick={() => onOpen(report)}><div className={`library-report-art art-${report.tone}`}><span><FileText size={24} /></span><Pill tone={report.status === "Ready" ? "ready" : "draft"}>{report.status}</Pill></div><div className="library-report-copy"><strong>{report.title}</strong><small>{report.mentee} · {report.date}</small><div><span><Clock3 size={13} /> {report.duration}</span><span><ListChecks size={13} /> 4 actions</span></div></div><MoreHorizontal size={18} /></button>)}</div></div>;
}

function SessionsView({ isRecording, setIsRecording, onNew }: { isRecording: boolean; setIsRecording: (value: boolean) => void; onNew: () => void }) {
  return <div className="session-view"><div className={`session-stage surface-card ${isRecording ? "session-live" : ""}`}><div className="session-stage-top"><span className="section-kicker">Live capture room</span><Pill tone={isRecording ? "recording" : "neutral"}>{isRecording ? <><i className="record-dot" /> Recording now</> : "Ready to capture"}</Pill></div><div className="session-visual"><div className="soundwave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="session-core"><AudioLines size={31} />{isRecording && <span className="session-timer">00:14</span>}</div><div className="soundwave mirrored"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><h2>{isRecording ? "You're in the room." : "A better note-taker is waiting."}</h2><p>{isRecording ? "Stay present. Men.AI is listening for themes, decisions, and the next right step." : "Capture your next mentorship session and let AI surface what matters."}</p><div className="session-buttons">{isRecording ? <button className="stop-button" onClick={() => { setIsRecording(false); toast.success("Session saved", { description: "Your transcript is ready for AI processing." }); }}><span /> Stop recording</button> : <button className="primary-button large" onClick={() => setIsRecording(true)}><Mic2 size={18} /> Start recording</button>}<button className="secondary-button large" onClick={onNew}><FileUp size={17} /> Upload transcript</button></div></div><div className="session-side"><div className="surface-card session-meta"><div className="card-heading"><div><span className="section-kicker">Before you begin</span><h3>Session context</h3></div><Settings2 size={17} /></div><label>Topic<input placeholder="e.g. Portfolio review" defaultValue="Weekly mentorship sync" /></label><label>Mentee<select defaultValue="Aarav"><option value="Aarav">Aarav Mehta</option><option value="Maya">Maya Chen</option><option value="Noah">Noah Williams</option></select></label><label>Session goal<textarea placeholder="What would make this conversation useful?" defaultValue="Align on the first research sprint and unblock next steps." /></label></div><div className="ai-tip"><div className="tip-icon"><Sparkles size={17} /></div><span><strong>Men.AI will look for</strong><small>Decisions · key themes · commitments · signals of progress</small></span></div></div></div>;
}

function ActionsView({ actions, filter, setFilter, onToggle, onAdd, onEdit, onDelete }: { actions: ActionItem[]; filter: "all" | "open" | "done"; setFilter: (value: "all" | "open" | "done") => void; onToggle: (id: number) => void; onAdd: () => void; onEdit: (item: ActionItem) => void; onDelete: (item: ActionItem) => void }) {
  const openActionsCount = actions.filter(action => action.status === "open").length;
  const completedActionsCount = actions.filter(action => action.status === "done").length;
  const totalActionsCount = actions.length;

  return <div className="view-stack"><div className="action-board-header surface-card"><div><span className="section-kicker">This week</span><h2>Small promises, kept</h2><p>{totalActionsCount} action items are connected to your reports.</p></div><div className="action-board-score"><strong>{completedActionsCount}<span>/{totalActionsCount}</span></strong><small>complete</small></div></div><div className="actions-toolbar"><div className="filter-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{totalActionsCount}</span></button><button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>Open <span>{openActionsCount}</span></button><button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Completed <span>{completedActionsCount}</span></button></div><button className="secondary-button" onClick={onAdd}><Plus size={16} /> Add action</button></div><div className="surface-card full-actions-card">{actions.map((item) => <ActionRow key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</div></div>;
}

function PeopleView({ onOpen, reports }: { onOpen: (report: Report) => void; reports: Report[] }) {
  const people = [{ initials: "AM", tone: "blue", name: "Aarav Mehta", detail: "Product design · 6 months", progress: 58, status: "Needs focus" }, { initials: "MC", tone: "peach", name: "Maya Chen", detail: "Career transition · 3 months", progress: 82, status: "On track" }, { initials: "NW", tone: "lavender", name: "Noah Williams", detail: "Leadership · 11 months", progress: 71, status: "On track" }];
  return <div className="view-stack"><div className="people-header surface-card"><div><span className="section-kicker">Mentorship roster</span><h2>Relationships with context</h2><p>See the human story behind every progress signal.</p></div><button className="primary-button" onClick={() => toast.success("Invite flow opened", { description: "Add a mentee to start a new relationship." })}><Plus size={17} /> Add mentee</button></div><div className="people-grid">{people.map((person, index) => <button className="person-card surface-card" key={person.name} onClick={() => onOpen(reports[index])}><div className="person-top"><Avatar initials={person.initials} tone={person.tone} size="lg" /><Pill tone={person.status === "On track" ? "ready" : "attention"}>{person.status}</Pill></div><strong>{person.name}</strong><small>{person.detail}</small><div className="person-progress"><span><i style={{ width: `${person.progress}%` }} /></span><b>{person.progress}%</b></div><div className="person-footer"><span><CalendarDays size={14} /> Last session {index === 0 ? "Today" : index === 1 ? "Yesterday" : "Nov 05"}</span><ChevronRight size={16} /></div></button>)}</div></div>;
}

function NewReportModal({ close, title, setTitle, mentee, setMentee, mentees, selectedFile, setSelectedFile, isGenerating, generated, generate, userRole }: { close: () => void; title: string; setTitle: (value: string) => void; mentee: string; setMentee: (value: string) => void; mentees: Mentee[]; selectedFile: File | null; setSelectedFile: (file: File | null) => void; isGenerating: boolean; generated: boolean; generate: () => void; userRole: string }) {
  const [dragOver, setDragOver] = useState(false);
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

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card new-report-modal"><button className="modal-close icon-button" onClick={close} aria-label="Close"><X size={18} /></button>{generated ? <div className="generated-state"><div className="generated-icon"><CheckCircle2 size={31} /></div><span className="section-kicker">Report generated</span><h2>Your conversation has shape.</h2><p>Men.AI found a clear summary, 3 themes, and 4 next steps from this session.</p><div className="generated-preview"><div><Sparkles size={16} /><span><strong>{title}</strong><small>{mentee} · Ready to review</small></span></div><Pill tone="ready">Ready</Pill></div><div className="generated-actions"><button className="primary-button" onClick={close}>Open report <ArrowUpRight size={16} /></button><button className="secondary-button" onClick={() => toast.success("Report shared", { description: "A secure share link has been copied." })}><Share2 size={15} /> Share</button></div></div> : <><div className="modal-icon"><WandSparkles size={21} /></div><span className="section-kicker">New AI report</span><h2>What are we unpacking?</h2><p>Give this session a little context. Men.AI will take it from there.</p><div className="source-switcher"><button className="source-option active"><Mic2 size={18} /><span><strong>Live session</strong><small>Record in the room</small></span><CheckCircle2 size={17} /></button><button className="source-option" onClick={() => fileInputRef.current?.click()}><FileUp size={18} /><span><strong>Upload a file</strong><small>Audio, video, or transcript</small></span><Plus size={17} /></button></div><div className="form-grid"><label>Session title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>{userRole === "mentor" && <label>Mentee<select value={mentee} onChange={(event) => setMentee(event.target.value)}><option value="">Select a mentee</option>{mentees.map((m) => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}</select></label>}</div><label className={`drop-zone ${dragOver ? "drag-over" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}><input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.mp4,.mov,.mkv,.txt,.pdf,.docx" onChange={(e) => { if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]); }} style={{ display: "none" }} /><FileUp size={21} /><span><strong>{selectedFile ? selectedFile.name : "Drop a conversation file here"}</strong><small>{selectedFile ? `${formatFileSize(selectedFile.size)} · Click to replace` : "or browse from your computer · up to 500 MB"}</small></span>{selectedFile && <button type="button" className="icon-button subtle" onClick={removeFile} aria-label="Remove file"><X size={16} /></button>}</label><button className="primary-button modal-submit" onClick={generate} disabled={isGenerating || !selectedFile}>{isGenerating ? <><RefreshCw size={17} className="spin" /> Generating report...</> : <><Sparkles size={17} /> Generate with Men.AI</>}</button><p className="modal-note"><Check size={14} /> You can review and edit every section before sharing.</p></>}</div></div>;
}

function ReportPreview({ report, close, onRefine }: { report: Report; close: () => void; onRefine: () => void }) {
  const content = report.reportContent as any;
  const summary = content?.meeting_summary || "";
  const themes = content?.discussion_points || [];

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card report-preview-modal"><div className="preview-topbar"><div><button className="back-button" onClick={close}><ChevronRight size={16} className="rotate-180" /> Back to workspace</button><span className="section-kicker">AI-generated report</span><h2>{report.title}</h2><p><Avatar initials={report.initials} tone={report.tone} size="sm" /> {report.mentee} <span>·</span> {report.date}</p></div><div className="preview-top-actions"><button className="icon-button subtle" aria-label="Archive report" onClick={() => toast.success("Report archived")}><Archive size={17} /></button><button className="secondary-button" onClick={() => toast.success("Report link copied", { description: "Anyone with the link can view this report." })}><Share2 size={15} /> Share</button><button className="primary-button" onClick={async () => {
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

function AnalyticsView() {
  return (
    <div className="view-stack">
      <div className="people-header surface-card">
        <div>
          <span className="section-kicker">Performance insights</span>
          <h2>Data behind the growth</h2>
          <p>Track engagement, goal completion, and impact over time.</p>
        </div>
        <button className="secondary-button" onClick={() => toast.info("Exporting analytics")}>
          <Download size={16} /> Export report
        </button>
      </div>

      <section className="hero-grid">
        <div className="surface-card progress-card">
          <div className="card-heading">
            <div><span className="section-kicker">Engagement</span><h3>Session frequency</h3></div>
          </div>
          <div className="progress-number"><strong>4.2<span>/mo</span></strong><Pill tone="up"><TrendingUp size={13} /> 8%</Pill></div>
          <p className="muted-copy">Average sessions per mentee</p>
          <MiniTrend />
        </div>
        <div className="surface-card progress-card">
          <div className="card-heading">
            <div><span className="section-kicker">Impact</span><h3>Goal completion</h3></div>
          </div>
          <div className="progress-number"><strong>68<span>%</span></strong><Pill tone="up"><TrendingUp size={13} /> 4.2%</Pill></div>
          <p className="muted-copy">of assigned goals are completed</p>
          <div className="progress-foot"><span><i className="legend-dot blue" /> On track</span><strong>42 / 62</strong></div>
        </div>
      </section>

      <section className="metric-strip">
        <div className="metric-item"><span className="metric-icon metric-blue"><FileText size={17} /></span><span><small>Total reports</small><strong>124</strong></span></div>
        <div className="metric-item"><span className="metric-icon metric-coral"><UsersRound size={17} /></span><span><small>Active mentees</small><strong>8</strong></span></div>
        <div className="metric-item"><span className="metric-icon metric-lilac"><Clock3 size={17} /></span><span><small>Hours mentored</small><strong>86.5</strong></span></div>
      </section>

      <div className="surface-card" style={{ padding: '24px' }}>
        <h3>Mentee growth distribution</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', marginTop: '24px', paddingBottom: '20px', borderBottom: '1px solid #edf1f5' }}>
          {[45, 72, 58, 84, 91, 65, 78, 88].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: '#2f6bff', borderRadius: '4px 4px 0 0', opacity: 0.1 + (h / 100) }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#9aa7b8', fontSize: '11px' }}>
          <span>Nov 04</span>
          <span>Today</span>
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

function AddActionModal({ close, onAdd, defaultData }: { close: () => void; onAdd: (data: any) => void; defaultData?: any }) {
  const [title, setTitle] = useState(defaultData?.title || '');
  const [description, setDescription] = useState(defaultData?.description || '');
  const [assignedTo, setAssignedTo] = useState(defaultData?.assigned_to || 'You');
  const [relatedMeeting, setRelatedMeeting] = useState(defaultData?.related_meeting || '');
  const [priority, setPriority] = useState(defaultData?.priority ? defaultData.priority.charAt(0).toUpperCase() + defaultData.priority.slice(1) : 'Medium');
  const [status, setStatus] = useState(defaultData?.status ? defaultData.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending');
  const [dueDate, setDueDate] = useState(defaultData?.due_date || '');
  const [category, setCategory] = useState(defaultData?.category || 'General');
  const [notes, setNotes] = useState(defaultData?.notes || '');

  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = ['Pending', 'In Progress', 'Completed'];
  const categoryOptions = ['General', 'Meeting Follow-up', 'Study', 'Project', 'Career', 'Personal'];
  const assignedOptions = ['You', 'Aarav Mehta', 'Maya Chen', 'Noah Williams'];

  const handleSubmit = () => {
    if (!title.trim()) return;

    const actionData = {
      title: title.trim(),
      description: description.trim() || null,
      assignedTo: assignedTo || 'You',
      relatedMeeting: relatedMeeting.trim() || null,
      priority: priority.toLowerCase(),
      status: status.toLowerCase().replace(' ', '_'),
      dueDate: dueDate || null,
      category: category,
      notes: notes.trim() || null,
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

          <label>Assigned To<select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>{assignedOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label>Related Meeting<input value={relatedMeeting} onChange={(e) => setRelatedMeeting(e.target.value)} placeholder="e.g., Weekly mentorship sync" /></label>

          <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value)}>{priorityOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}>{statusOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label>Due Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>

          <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{categoryOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}</select></label>

          <label style={{gridColumn: 'span 2'}}>Additional Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details, context, or notes..." rows={2} /></label>
        </div>

        <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
          <button className="primary-button modal-submit" onClick={handleSubmit} style={{flex: 1}}>Save Action</button>
          <button className="secondary-button modal-submit" onClick={close} style={{flex: 1}}>Cancel</button>
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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reportTitle, setReportTitle] = useState("Weekly mentorship sync");
  const [reportMentee, setReportMentee] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const userRole = user?.role || localStorage.getItem('role') || 'mentor';
  const userName = user?.full_name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navItemsMentor: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "reports", label: "Reports", icon: FileText, badge: "12" },
    { key: "sessions", label: "Sessions", icon: AudioLines },
    { key: "actions", label: "Action items", icon: ListChecks, badge: "4" },
    { key: "people", label: "People", icon: UsersRound },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
    { key: "ai-assistant", label: "AI Assistant", icon: BrainCircuit },
  ];

  const navItemsMentee: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "sessions", label: "Sessions", icon: AudioLines },
    { key: "actions", label: "Action items", icon: ListChecks },
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
    queryKey: ['tasks'],
    queryFn: async () => {
      if (userRole === 'mentor') {
        const response = await api.get('/tasks/');
        return response.data;
      } else {
        const response = await api.get('/tasks/mentee');
        return response.data;
      }
    },
    enabled: !authLoading && !!user,
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
    const newStatus = action.status === "done" ? "pending" : "completed";
    const taskUpdateUrl = userRole === "mentee" ? `/tasks/mentee/${id}` : `/tasks/${id}`;
    api.put(taskUpdateUrl, { status: newStatus }).then(() => {
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
    setIsGenerating(false);
    setSelectedFile(null);
    if (mentees.length > 0 && !reportMentee) {
      setReportMentee(mentees[0].full_name);
    }
    setShowNewReport(true);
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
    if (actionItem.fullData) {
      setSelectedActionForEdit(actionItem.fullData);
      setShowEditActionModal(true);
    }
  };

  const handleActionDelete = async (actionItem: ActionItem) => {
    if (window.confirm("Are you sure you want to delete this action item? This cannot be undone.")) {
      try {
        await api.delete(userRole === "mentee" ? `/tasks/mentee/${actionItem.id}` : `/tasks/${actionItem.id}`);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast.success("Action item deleted successfully");
      } catch (err) {
        toast.error("Failed to delete action item");
      }
    }
  };

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
        <div className="workspace-switcher">
          <Avatar initials={userInitials} tone="navy" size="sm" />
          <span><small>Workspace</small><strong>{userName}'s practice</strong></span>
          <ChevronDown size={15} />
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
            <div className="search-wrap">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, people..." aria-label="Search reports and people" />
              <kbd>⌘ K</kbd>
            </div>
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
            {activeView === "overview" && <div className="heading-actions"><button className="secondary-button" onClick={() => toast.info("Weekly digest queued", { description: "We'll prepare a shareable summary of this week's progress." })}><Download size={16} /> Weekly digest</button><button className="primary-button" onClick={openNewReport}><Plus size={17} /> Capture a session</button></div>}
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
                    <div className="reports-toolbar"><span>3 most recent conversations</span><button className="filter-button" onClick={() => setSearch("")}><SlidersHorizontal size={14} /> All reports <ChevronDown size={14} /></button></div>
                    <div className="report-list">{filteredReports.slice(0, 3).map((report) => <ReportRow key={report.id} report={report} onOpen={setSelectedReport} />)}</div>
                  </div>
                  <div className="section-heading section-heading-actions"><div><span className="section-kicker">Shared accountability</span><h2>Action items</h2></div><button className="text-button" onClick={() => selectView("actions")}>View all <ArrowUpRight size={15} /></button></div>
                  <div className="surface-card actions-card">
                    <div className="action-progress"><div><strong>{dashboardMetrics.openActions} active commitments</strong><span>Keep the small promises moving.</span></div><div className="thin-progress"><span style={{ width: `${dashboardMetrics.actionCompletionRate}%` }} /></div><b>{dashboardMetrics.actionCompletionRate}%</b></div>
                    {baseActions.slice(0, 3).map((item) => <ActionRow key={item.id} item={item} onToggle={toggleAction} onEdit={handleActionEdit} onDelete={handleActionDelete} />)}
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

          {activeView === "reports" && <ReportsView reports={filteredReports} onOpen={setSelectedReport} onNew={openNewReport} />}
          {activeView === "sessions" && <SessionsView isRecording={isRecording} setIsRecording={setIsRecording} onNew={openNewReport} />}
          {activeView === "actions" && <ActionsView actions={filteredActions} filter={actionFilter} setFilter={setActionFilter} onToggle={toggleAction} onAdd={() => setShowAddAction(true)} onEdit={handleActionEdit} onDelete={handleActionDelete} />}
          {activeView === "people" && <PeopleView onOpen={setSelectedReport} reports={reports} />}
          {activeView === "analytics" && <AnalyticsView />}
          {activeView === "ai-assistant" && <AIAssistantView />}
          {activeView === "help" && <HelpCenterView />}
        </div>
      </main>

      {showNewReport && <NewReportModal close={closeNewReport} title={reportTitle} setTitle={setReportTitle} mentee={reportMentee} setMentee={setReportMentee} mentees={mentees} selectedFile={selectedFile} setSelectedFile={setSelectedFile} isGenerating={isGenerating} generated={generated} generate={handleGenerate} userRole={userRole} />}
      {showAddAction && <AddActionModal close={() => setShowAddAction(false)} onAdd={(data) => {
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
          ...(userRole === "mentor" ? { mentee_id: mentees[0]?.id } : {}),
        };
        const createTaskUrl = userRole === "mentee" ? "/tasks/mentee" : "/tasks/";
        api.post(createTaskUrl, payload).then(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          toast.success("Action item added");
        }).catch((err) => {
          toast.error("Failed to add action item");
        });
      }} />}
      {showEditActionModal && (
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
              };
              api.put(userRole === "mentee" ? `/tasks/mentee/${selectedActionForEdit.id}` : `/tasks/${selectedActionForEdit.id}`, payload).then(() => {
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
        />
      )}
      {selectedReport && <ReportPreview report={selectedReport} close={() => setSelectedReport(null)} onRefine={() => toast.success("Section refined", { description: "Men.AI polished the summary while keeping your meaning intact." })} />}
      <button className="command-hint" onClick={() => setShowCommand(true)}><Sparkles size={14} /> Press <kbd>⌘ K</kbd> to capture</button>
      {showCommand && <CommandModal close={() => setShowCommand(false)} onNew={() => { setShowCommand(false); openNewReport(); }} />}
    </div>
  );
}