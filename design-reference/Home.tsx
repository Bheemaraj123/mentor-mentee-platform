import {
  AlertCircle,
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
  FileText,
  FileUp,
  Flag,
  LayoutDashboard,
  ListChecks,
  Menu,
  Mic2,
  MoreHorizontal,
  Pause,
  Play,
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
  UserRound,
  UsersRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ViewKey = "overview" | "reports" | "sessions" | "actions" | "people";
type ActionStatus = "open" | "done";

type ActionItem = {
  id: number;
  title: string;
  owner: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: ActionStatus;
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
};

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "reports", label: "Reports", icon: FileText, badge: "12" },
  { key: "sessions", label: "Sessions", icon: AudioLines },
  { key: "actions", label: "Action items", icon: ListChecks, badge: "4" },
  { key: "people", label: "People", icon: UsersRound },
];

const reports: Report[] = [
  {
    id: 1,
    title: "Weekly mentorship sync",
    mentee: "Aarav Mehta",
    date: "Today, 10:30 AM",
    duration: "42 min",
    status: "Ready",
    tone: "blue",
    initials: "AM",
  },
  {
    id: 2,
    title: "Portfolio review & next steps",
    mentee: "Maya Chen",
    date: "Yesterday, 3:15 PM",
    duration: "36 min",
    status: "Ready",
    tone: "peach",
    initials: "MC",
  },
  {
    id: 3,
    title: "Quarterly growth check-in",
    mentee: "Noah Williams",
    date: "Nov 05, 11:00 AM",
    duration: "54 min",
    status: "Draft",
    tone: "lavender",
    initials: "NW",
  },
];

const baseActions: ActionItem[] = [
  { id: 1, title: "Share the revised project brief", owner: "Aarav", due: "Today", priority: "High", status: "open" },
  { id: 2, title: "Block time for user interviews", owner: "You", due: "Tomorrow", priority: "Medium", status: "open" },
  { id: 3, title: "Review portfolio case study draft", owner: "Maya", due: "Nov 14", priority: "Medium", status: "open" },
  { id: 4, title: "Send feedback on career goals", owner: "You", due: "Nov 16", priority: "Low", status: "done" },
];

const navCopy: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Tuesday, November 10, 2026",
    title: "Good morning, Priya",
    description: "Here’s the pulse of your mentorship practice.",
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

function ActionRow({ item, onToggle }: { item: ActionItem; onToggle: (id: number) => void }) {
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
      <button className="icon-button subtle" aria-label="More action options"><MoreHorizontal size={17} /></button>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [actions, setActions] = useState<ActionItem[]>(baseActions);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | "open" | "done">("all");
  const [showNewReport, setShowNewReport] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reportTitle, setReportTitle] = useState("Weekly mentorship sync");
  const [reportMentee, setReportMentee] = useState("Aarav Mehta");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const query = search.toLowerCase();
    return !query || `${report.title} ${report.mentee}`.toLowerCase().includes(query);
  }), [search]);

  const filteredActions = useMemo(() => actions.filter((item) => {
    const matchesFilter = actionFilter === "all" || item.status === actionFilter;
    const query = search.toLowerCase();
    return matchesFilter && (!query || `${item.title} ${item.owner}`.toLowerCase().includes(query));
  }), [actions, actionFilter, search]);

  const toggleAction = (id: number) => {
    setActions((current) => current.map((item) => item.id === id ? { ...item, status: item.status === "done" ? "open" : "done" } : item));
    toast.success("Action item updated", { description: "Your progress has been saved to this workspace." });
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
      toast.success("Report ready", { description: "Men.AI turned your conversation into a structured report." });
    }, 1100);
  };

  const openNewReport = () => {
    setGenerated(false);
    setIsGenerating(false);
    setShowNewReport(true);
  };

  const closeNewReport = () => {
    setShowNewReport(false);
    setGenerated(false);
    setIsGenerating(false);
  };

  const selectView = (view: ViewKey) => {
    setActiveView(view);
    setShowMobileNav(false);
  };

  return (
    <div className="menai-shell">
      <aside className={`side-rail ${showMobileNav ? "rail-open" : ""}`}>
        <div className="brand-lockup" onClick={() => selectView("overview")}>
          <LogoMark />
          <span>Men<span className="brand-dot">.</span>AI</span>
        </div>
        <div className="workspace-switcher">
          <Avatar initials="PS" tone="navy" size="sm" />
          <span><small>Workspace</small><strong>Priya’s practice</strong></span>
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
          <button className="nav-item" onClick={() => toast.info("Settings are coming next", { description: "Your workspace preferences will live here." })}><Settings2 size={18} /><span>Settings</span></button>
          <button className="nav-item" onClick={() => toast.info("Help center opened", { description: "Tip: use ⌘K to quickly start a report." })}><Circle size={18} /><span>Help center</span></button>
        </nav>
        <div className="rail-bottom">
          <div className="ai-mini-card">
            <span className="ai-mini-icon"><Sparkles size={15} /></span>
            <strong>AI usage</strong>
            <small>72% of monthly credits</small>
            <div className="usage-bar"><span style={{ width: "72%" }} /></div>
          </div>
          <button className="profile-chip" onClick={() => toast.info("Profile menu", { description: "Priya Shah · Mentor" })}>
            <Avatar initials="PS" tone="coral" size="sm" />
            <span><strong>Priya Shah</strong><small>Mentor account</small></span>
            <MoreHorizontal size={16} />
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
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => toast.info("You’re all caught up", { description: "No new notifications right now." })}><Bell size={18} /><i /></button>
            <button className="new-report-button" onClick={openNewReport}><Plus size={17} /><span>New report</span></button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">{navCopy[activeView].eyebrow}</p>
              <h1>{navCopy[activeView].title}</h1>
              <p className="page-description">{navCopy[activeView].description}</p>
            </div>
            {activeView === "overview" && <div className="heading-actions"><button className="secondary-button" onClick={() => toast.info("Weekly digest queued", { description: "We’ll prepare a shareable summary of this week’s progress." })}><Download size={16} /> Weekly digest</button><button className="primary-button" onClick={openNewReport}><Plus size={17} /> Capture a session</button></div>}
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
                  <div className="progress-number"><strong>84<span>%</span></strong><Pill tone="up"><TrendingUp size={13} /> 12.4%</Pill></div>
                  <p className="muted-copy">of your mentees have an active next step</p>
                  <MiniTrend />
                  <div className="progress-foot"><span><i className="legend-dot blue" /> Goals on track</span><strong>14 / 17</strong></div>
                </div>
              </section>

              <section className="metric-strip">
                <div className="metric-item"><span className="metric-icon metric-blue"><FileText size={17} /></span><span><small>Reports created</small><strong>24 <em>+8 this month</em></strong></span></div>
                <div className="metric-item"><span className="metric-icon metric-coral"><Target size={17} /></span><span><small>Goals completed</small><strong>68% <em>+4.2% vs last month</em></strong></span></div>
                <div className="metric-item"><span className="metric-icon metric-lilac"><Clock3 size={17} /></span><span><small>Time saved by AI</small><strong>6.4 hrs <em>this month</em></strong></span></div>
                <div className="metric-item metric-tip"><Zap size={18} /><span><strong>One small win</strong><small>3 commitments closed this week</small></span><ArrowUpRight size={16} /></div>
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
                    <div className="action-progress"><div><strong>4 active commitments</strong><span>Keep the small promises moving.</span></div><div className="thin-progress"><span style={{ width: "63%" }} /></div><b>63%</b></div>
                    {actions.slice(0, 3).map((item) => <ActionRow key={item.id} item={item} onToggle={toggleAction} />)}
                  </div>
                </div>
                <aside className="right-column">
                  <div className="section-heading"><div><span className="section-kicker">Mentee spotlight</span><h2>Needs attention</h2></div><button className="icon-button subtle"><MoreHorizontal size={18} /></button></div>
                  <div className="surface-card spotlight-card">
                    <div className="spotlight-head"><Avatar initials="AM" tone="blue" size="lg" /><span><strong>Aarav Mehta</strong><small>Product design · 6 months</small></span><span className="status-pulse" /></div>
                    <div className="spotlight-divider" />
                    <div className="spotlight-goal"><div className="goal-icon"><Flag size={16} /></div><span><small>Current focus</small><strong>Ship first research sprint</strong></span><Pill tone="attention">Needs focus</Pill></div>
                    <div className="goal-progress"><span><i style={{ width: "58%" }} /></span><small>58% complete</small></div>
                    <p className="spotlight-note"><Sparkles size={14} /> AI noticed this goal hasn’t moved since your last two sessions.</p>
                    <button className="outline-button" onClick={() => { setSelectedReport(reports[0]); toast.info("Opening Aarav’s context"); }}>Review context <ChevronRight size={15} /></button>
                  </div>
                  <div className="surface-card goal-card"><div className="card-heading"><div><span className="section-kicker">Your practice</span><h3>Goals at a glance</h3></div><ProgressRing value={72} /></div><div className="goal-list"><div><span className="goal-check green"><Check size={13} /></span><span><strong>Career clarity</strong><small>On track</small></span><b>92%</b></div><div><span className="goal-check orange"><Clock3 size={13} /></span><span><strong>Portfolio confidence</strong><small>Needs a nudge</small></span><b>58%</b></div><div><span className="goal-check blue"><Target size={13} /></span><span><strong>Leadership practice</strong><small>On track</small></span><b>71%</b></div></div></div>
                  <div className="ai-tip"><div className="tip-icon"><WandSparkles size={17} /></div><span><strong>AI tip for you</strong><small>Try ending your next session with one “show me” commitment.</small></span><ChevronRight size={16} /></div>
                </aside>
              </section>
            </>
          )}

          {activeView === "reports" && <ReportsView reports={filteredReports} onOpen={setSelectedReport} onNew={openNewReport} />}
          {activeView === "sessions" && <SessionsView isRecording={isRecording} setIsRecording={setIsRecording} onNew={openNewReport} />}
          {activeView === "actions" && <ActionsView actions={filteredActions} filter={actionFilter} setFilter={setActionFilter} onToggle={toggleAction} />}
          {activeView === "people" && <PeopleView onOpen={setSelectedReport} />}
        </div>
      </main>

      {showNewReport && <NewReportModal close={closeNewReport} title={reportTitle} setTitle={setReportTitle} mentee={reportMentee} setMentee={setReportMentee} isGenerating={isGenerating} generated={generated} generate={handleGenerate} />}
      {selectedReport && <ReportPreview report={selectedReport} close={() => setSelectedReport(null)} onRefine={() => toast.success("Section refined", { description: "Men.AI polished the summary while keeping your meaning intact." })} />}
      <button className="command-hint" onClick={() => setShowCommand(true)}><Sparkles size={14} /> Press <kbd>⌘ K</kbd> to capture</button>
      {showCommand && <CommandModal close={() => setShowCommand(false)} onNew={() => { setShowCommand(false); openNewReport(); }} />}
    </div>
  );
}

function ReportsView({ reports, onOpen, onNew }: { reports: Report[]; onOpen: (report: Report) => void; onNew: () => void }) {
  return <div className="view-stack"><div className="library-summary"><div className="library-summary-main"><div className="summary-icon"><FileText size={21} /></div><span><strong>24 reports</strong><small>Across 8 active mentorships</small></span></div><div className="summary-stats"><span><strong>19</strong><small>Ready to share</small></span><span><strong>3</strong><small>Drafts</small></span><span><strong>2</strong><small>Processing</small></span></div><button className="primary-button" onClick={onNew}><Plus size={17} /> New report</button></div><div className="library-toolbar surface-card"><div className="library-tabs"><button className="library-tab active">All reports <span>24</span></button><button className="library-tab">Ready <span>19</span></button><button className="library-tab">Drafts <span>3</span></button></div><button className="filter-button"><SlidersHorizontal size={14} /> Sort: newest <ChevronDown size={14} /></button></div><div className="report-library-grid">{reports.map((report) => <button className="library-report surface-card" key={report.id} onClick={() => onOpen(report)}><div className={`library-report-art art-${report.tone}`}><span><FileText size={24} /></span><Pill tone={report.status === "Ready" ? "ready" : "draft"}>{report.status}</Pill></div><div className="library-report-copy"><strong>{report.title}</strong><small>{report.mentee} · {report.date}</small><div><span><Clock3 size={13} /> {report.duration}</span><span><ListChecks size={13} /> 4 actions</span></div></div><MoreHorizontal size={18} /></button>)}</div></div>;
}

function SessionsView({ isRecording, setIsRecording, onNew }: { isRecording: boolean; setIsRecording: (value: boolean) => void; onNew: () => void }) {
  return <div className="session-view"><div className={`session-stage surface-card ${isRecording ? "session-live" : ""}`}><div className="session-stage-top"><span className="section-kicker">Live capture room</span><Pill tone={isRecording ? "recording" : "neutral"}>{isRecording ? <><i className="record-dot" /> Recording now</> : "Ready to capture"}</Pill></div><div className="session-visual"><div className="soundwave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="session-core"><AudioLines size={31} />{isRecording && <span className="session-timer">00:14</span>}</div><div className="soundwave mirrored"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><h2>{isRecording ? "You’re in the room." : "A better note-taker is waiting."}</h2><p>{isRecording ? "Stay present. Men.AI is listening for themes, decisions, and the next right step." : "Capture your next mentorship session and let AI surface what matters."}</p><div className="session-buttons">{isRecording ? <button className="stop-button" onClick={() => { setIsRecording(false); toast.success("Session saved", { description: "Your transcript is ready for AI processing." }); }}><span /> Stop recording</button> : <button className="primary-button large" onClick={() => setIsRecording(true)}><Mic2 size={18} /> Start recording</button>}<button className="secondary-button large" onClick={onNew}><FileUp size={17} /> Upload transcript</button></div></div><div className="session-side"><div className="surface-card session-meta"><div className="card-heading"><div><span className="section-kicker">Before you begin</span><h3>Session context</h3></div><Settings2 size={17} /></div><label>Topic<input placeholder="e.g. Portfolio review" defaultValue="Weekly mentorship sync" /></label><label>Mentee<select defaultValue="Aarav"><option value="Aarav">Aarav Mehta</option><option value="Maya">Maya Chen</option><option value="Noah">Noah Williams</option></select></label><label>Session goal<textarea placeholder="What would make this conversation useful?" defaultValue="Align on the first research sprint and unblock next steps." /></label></div><div className="ai-tip"><div className="tip-icon"><Sparkles size={17} /></div><span><strong>Men.AI will look for</strong><small>Decisions · key themes · commitments · signals of progress</small></span></div></div></div>;
}

function ActionsView({ actions, filter, setFilter, onToggle }: { actions: ActionItem[]; filter: "all" | "open" | "done"; setFilter: (value: "all" | "open" | "done") => void; onToggle: (id: number) => void }) {
  return <div className="view-stack"><div className="action-board-header surface-card"><div><span className="section-kicker">This week</span><h2>Small promises, kept</h2><p>Four action items are connected to your latest reports.</p></div><div className="action-board-score"><strong>{actions.filter((item) => item.status === "done").length}<span>/4</span></strong><small>complete</small></div></div><div className="actions-toolbar"><div className="filter-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>4</span></button><button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>Open <span>3</span></button><button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Completed <span>1</span></button></div><button className="secondary-button" onClick={() => toast.success("New action item added", { description: "It’s ready to assign from the next report." })}><Plus size={16} /> Add action</button></div><div className="surface-card full-actions-card">{actions.map((item) => <ActionRow key={item.id} item={item} onToggle={onToggle} />)}</div></div>;
}

function PeopleView({ onOpen }: { onOpen: (report: Report) => void }) {
  const people = [{ initials: "AM", tone: "blue", name: "Aarav Mehta", detail: "Product design · 6 months", progress: 58, status: "Needs focus" }, { initials: "MC", tone: "peach", name: "Maya Chen", detail: "Career transition · 3 months", progress: 82, status: "On track" }, { initials: "NW", tone: "lavender", name: "Noah Williams", detail: "Leadership · 11 months", progress: 71, status: "On track" }];
  return <div className="view-stack"><div className="people-header surface-card"><div><span className="section-kicker">Mentorship roster</span><h2>Relationships with context</h2><p>See the human story behind every progress signal.</p></div><button className="primary-button" onClick={() => toast.success("Invite flow opened", { description: "Add a mentee to start a new relationship." })}><Plus size={17} /> Add mentee</button></div><div className="people-grid">{people.map((person, index) => <button className="person-card surface-card" key={person.name} onClick={() => onOpen(reports[index])}><div className="person-top"><Avatar initials={person.initials} tone={person.tone} size="lg" /><Pill tone={person.status === "On track" ? "ready" : "attention"}>{person.status}</Pill></div><strong>{person.name}</strong><small>{person.detail}</small><div className="person-progress"><span><i style={{ width: `${person.progress}%` }} /></span><b>{person.progress}%</b></div><div className="person-footer"><span><CalendarDays size={14} /> Last session {index === 0 ? "Today" : index === 1 ? "Yesterday" : "Nov 05"}</span><ChevronRight size={16} /></div></button>)}</div></div>;
}

function NewReportModal({ close, title, setTitle, mentee, setMentee, isGenerating, generated, generate }: { close: () => void; title: string; setTitle: (value: string) => void; mentee: string; setMentee: (value: string) => void; isGenerating: boolean; generated: boolean; generate: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card new-report-modal"><button className="modal-close icon-button" onClick={close} aria-label="Close"><X size={18} /></button>{generated ? <div className="generated-state"><div className="generated-icon"><CheckCircle2 size={31} /></div><span className="section-kicker">Report generated</span><h2>Your conversation has shape.</h2><p>Men.AI found a clear summary, 3 themes, and 4 next steps from this session.</p><div className="generated-preview"><div><Sparkles size={16} /><span><strong>{title}</strong><small>{mentee} · Ready to review</small></span></div><Pill tone="ready">Ready</Pill></div><div className="generated-actions"><button className="primary-button" onClick={close}>Open report <ArrowUpRight size={16} /></button><button className="secondary-button" onClick={() => toast.success("Report shared", { description: "A secure share link has been copied." })}><Share2 size={15} /> Share</button></div></div> : <><div className="modal-icon"><WandSparkles size={21} /></div><span className="section-kicker">New AI report</span><h2>What are we unpacking?</h2><p>Give this session a little context. Men.AI will take it from there.</p><div className="source-switcher"><button className="source-option active"><Mic2 size={18} /><span><strong>Live session</strong><small>Record in the room</small></span><CheckCircle2 size={17} /></button><button className="source-option" onClick={() => toast.info("File picker ready", { description: "Choose an audio, video, or transcript file to continue." })}><FileUp size={18} /><span><strong>Upload a file</strong><small>Audio, video, or transcript</small></span><Plus size={17} /></button></div><div className="form-grid"><label>Session title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Mentee<select value={mentee} onChange={(event) => setMentee(event.target.value)}><option>Aarav Mehta</option><option>Maya Chen</option><option>Noah Williams</option></select></label></div><label className="drop-zone"><input type="file" /><FileUp size={21} /><span><strong>Drop a conversation file here</strong><small>or browse from your computer · up to 500 MB</small></span></label><button className="primary-button modal-submit" onClick={generate} disabled={isGenerating}>{isGenerating ? <><RefreshCw size={17} className="spin" /> Generating report...</> : <><Sparkles size={17} /> Generate with Men.AI</>}</button><p className="modal-note"><Check size={14} /> You can review and edit every section before sharing.</p></>}</div></div>;
}

function ReportPreview({ report, close, onRefine }: { report: Report; close: () => void; onRefine: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-card report-preview-modal"><div className="preview-topbar"><div><button className="back-button" onClick={close}><ChevronRight size={16} className="rotate-180" /> Back to workspace</button><span className="section-kicker">AI-generated report</span><h2>{report.title}</h2><p><Avatar initials={report.initials} tone={report.tone} size="sm" /> {report.mentee} <span>·</span> {report.date}</p></div><div className="preview-top-actions"><button className="icon-button subtle" aria-label="Archive report" onClick={() => toast.success("Report archived")}><Archive size={17} /></button><button className="secondary-button" onClick={() => toast.success("Report link copied", { description: "Anyone with the link can view this report." })}><Share2 size={15} /> Share</button><button className="primary-button" onClick={() => toast.success("Report exported", { description: "Your PDF is being prepared." })}><Download size={15} /> Export PDF</button><button className="icon-button modal-close" onClick={close} aria-label="Close"><X size={18} /></button></div></div><div className="report-preview-layout"><article className="report-document"><div className="report-document-meta"><Pill tone="ready">Ready to share</Pill><span><Clock3 size={14} /> 42 min conversation</span><span><CheckCircle2 size={14} /> AI reviewed by you</span></div><div className="report-section report-summary"><div className="report-section-title"><span className="number-badge">01</span><div><span className="section-kicker">Meeting summary</span><h3>A thoughtful check-in with a clear next move.</h3></div><button className="edit-link" onClick={onRefine}><WandSparkles size={14} /> Refine with AI</button></div><p>Aarav is gaining confidence in how he frames product problems, but he is still hesitating to move from research into a first shipped experiment. The conversation focused on turning his curiosity into a small, testable sprint.</p></div><div className="report-section"><div className="report-section-title"><span className="number-badge">02</span><div><span className="section-kicker">Key themes</span><h3>What surfaced in the room</h3></div><button className="icon-button subtle" onClick={() => toast.success("Key themes copied")}><Copy size={15} /></button></div><div className="theme-grid"><span>Finding the smallest useful experiment</span><span>Separating signal from perfectionism</span><span>Making research visible to the team</span></div></div><div className="report-columns"><div className="report-section compact-section"><div className="report-section-title"><span className="number-badge">03</span><div><span className="section-kicker">Progress</span><h3>Wins to carry forward</h3></div></div><ul className="check-list"><li><CheckCircle2 size={16} /> Reframed the research sprint around one user question</li><li><CheckCircle2 size={16} /> Named a first experiment that can ship this week</li><li><CheckCircle2 size={16} /> Asked for feedback before polishing the full deck</li></ul></div><div className="report-section compact-section"><div className="report-section-title"><span className="number-badge coral">04</span><div><span className="section-kicker">Attention</span><h3>Where support helps</h3></div></div><p className="attention-copy">Aarav may benefit from a concrete deadline and a quick mid-week check-in to keep the first experiment moving.</p></div></div></article><aside className="preview-aside"><div className="ai-summary-card"><div className="ai-summary-top"><span className="ai-summary-icon"><Sparkles size={15} /></span><span><strong>Men.AI readout</strong><small>Confidence 94%</small></span></div><p>“Aarav left with more clarity than he arrived with. The next conversation should be about evidence, not more planning.”</p><button className="ai-action" onClick={() => toast.success("3 action items extracted", { description: "They’re now in your shared action list." })}><ListChecks size={15} /> Extract action items <ArrowUpRight size={14} /></button></div><div className="preview-aside-card"><div className="card-heading"><div><span className="section-kicker">Next steps</span><h3>4 commitments</h3></div><button className="icon-button subtle"><MoreHorizontal size={17} /></button></div><div className="preview-actions"><span><CheckCircle2 size={15} /> Define the research question</span><span><CheckCircle2 size={15} /> Schedule 3 user interviews</span><span><Circle size={15} /> Share the one-page brief</span><span><Circle size={15} /> Bring evidence to next sync</span></div></div></aside></div></div></div>;
}

function CommandModal({ close, onNew }: { close: () => void; onNew: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="command-modal modal-card"><button className="modal-close icon-button" onClick={close} aria-label="Close"><X size={18} /></button><span className="section-kicker">Quick actions</span><h2>What would you like to do?</h2><div className="command-list"><button onClick={onNew}><span className="command-icon blue"><Plus size={18} /></span><span><strong>Start a new report</strong><small>Capture a live session or upload a file</small></span><kbd>↵</kbd></button><button onClick={() => { close(); toast.info("Search focused"); document.querySelector<HTMLInputElement>(".search-wrap input")?.focus(); }}><span className="command-icon lilac"><Search size={18} /></span><span><strong>Search your workspace</strong><small>Find reports, people, and action items</small></span><kbd>/</kbd></button><button onClick={() => { close(); toast.info("Digest queued", { description: "We’ll prepare your weekly mentorship digest." }); }}><span className="command-icon coral"><Download size={18} /></span><span><strong>Export weekly digest</strong><small>Share a snapshot of momentum</small></span><kbd>⌘ D</kbd></button></div></div></div>;
}
