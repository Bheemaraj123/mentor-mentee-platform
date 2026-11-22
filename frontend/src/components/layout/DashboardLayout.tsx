import { type ReactNode, useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  FileText,
  AudioLines,
  ListChecks,
  TrendingUp,
  Bell,
  Settings2,
  LogOut,
  ChevronDown,
  Menu,
  ChevronRight,
  Search,
  Plus,
  Sparkles,
  BrainCircuit,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

interface DashboardLayoutProps {
  children?: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const role = user?.role || localStorage.getItem('role') || 'mentor';
  const userName = user?.full_name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const toggleWorkspaceMenu = () => {
    setShowWorkspaceMenu((open) => !open);
  };

  const handleProfileClick = () => {
    navigate(`/${role}/settings`);
    setShowWorkspaceMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const mentorNavItems = [
    { key: "dashboard", label: "Overview", path: "/mentor/dashboard", icon: LayoutDashboard },
    { key: "reports", label: "Reports", path: "/mentor/reports", icon: FileText },
    { key: "sessions", label: "Sessions", path: "/mentor/sessions", icon: AudioLines },
    { key: "actions", label: "Action items", path: "/mentor/actions", icon: ListChecks },
    { key: "people", label: "People", path: "/mentor/people", icon: UsersRound },
    { key: "analytics", label: "Analytics", path: "/mentor/analytics", icon: TrendingUp },
    { key: "ai-assistant", label: "AI Assistant", path: "/mentor/ai-assistant", icon: BrainCircuit },
  ];

  const menteeNavItems = [
    { key: "dashboard", label: "Overview", path: "/mentee/dashboard", icon: LayoutDashboard },
    { key: "reports", label: "Reports", path: "/mentee/reports", icon: FileText },
    { key: "sessions", label: "Sessions", path: "/mentee/sessions", icon: AudioLines },
    { key: "actions", label: "Action items", path: "/mentee/actions", icon: ListChecks },
    { key: "analytics", label: "Progress", path: "/mentee/analytics", icon: TrendingUp },
    { key: "ai-assistant", label: "AI Assistant", path: "/mentee/ai-assistant", icon: BrainCircuit },
  ];

  const navItems = role === 'mentor' ? mentorNavItems : menteeNavItems;

  const currentNavItem = navItems.find(item => location.pathname.includes(item.key)) || navItems[0];

  return (
    <div className="menai-shell">
      <aside className={`side-rail ${showMobileNav ? "rail-open" : ""}`}>
        <div className="brand-lockup" onClick={() => navigate(`/${role}/dashboard`)}>
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
          {navItems.map(({ key, label, path, icon: Icon }) => {
            const isActive = location.pathname.includes(key);
            return (
              <button
                key={key}
                className={`nav-item ${isActive ? "nav-active" : ""}`}
                onClick={() => {
                  navigate(path);
                  setShowMobileNav(false);
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="rail-label rail-label-lower">Manage</div>
        <nav className="main-nav">
          <button
            className={`nav-item ${location.pathname.includes('settings') ? "nav-active" : ""}`}
            onClick={() => {
              navigate(`/${role}/settings`);
              setShowMobileNav(false);
            }}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          <button
            className={`nav-item ${location.pathname.includes('notifications') ? "nav-active" : ""}`}
            onClick={() => {
              navigate(`/${role}/notifications`);
              setShowMobileNav(false);
            }}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>
        </nav>
        <div className="rail-bottom">
          <div className="ai-mini-card">
            <span className="ai-mini-icon"><Sparkles size={15} /></span>
            <strong>AI usage</strong>
            <small>72% of monthly credits</small>
            <div className="usage-bar"><span style={{ width: "72%" }} /></div>
          </div>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setShowMobileNav((open) => !open)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Men.AI</span><ChevronRight size={15} /><strong>{currentNavItem.label}</strong></div>
          <div className="topbar-actions">
            <div className="search-wrap">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workspace..." aria-label="Search workspace" />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => navigate(`/${role}/notifications`)}
            >
              <Bell size={18} />
              <i />
            </button>
            <button className="new-report-button" onClick={() => navigate(`/${role}/sessions`)}><Plus size={17} /><span>New report</span></button>
          </div>
        </header>

        {children ?? <Outlet />}
      </main>
    </div>
  );
};