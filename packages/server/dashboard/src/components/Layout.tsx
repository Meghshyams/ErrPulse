import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useProject } from "../context/ProjectContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  Globe,
  Terminal,
  Activity,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/errors", icon: AlertTriangle, label: "Errors" },
  { to: "/requests", icon: Globe, label: "Requests" },
  { to: "/logs", icon: Terminal, label: "Logs" },
];

const PROJECT_COLORS = [
  "#f43f5e",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function getProjectColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.split(/[-_./\s]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Layout() {
  const [liveCount, setLiveCount] = useState(0);
  const [projectPopover, setProjectPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { projects, selectedProjectId, setProjectId } = useProject();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleMessage = useCallback(() => {
    setLiveCount((c) => c + 1);
    setTimeout(() => setLiveCount((c) => Math.max(0, c - 1)), 3000);
  }, []);

  const { connected } = useWebSocket(handleMessage);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setProjectPopover(false);
      }
    }
    if (projectPopover) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [projectPopover]);

  // Page title for the top bar
  const pageTitle =
    NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )?.label ?? "Overview";

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Icon Rail - hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex w-[52px] flex-shrink-0 bg-sidebar flex-col items-center border-r border-border/40">
        {/* Brand mark */}
        <div className="h-[52px] flex items-center justify-center">
          <div className="w-8 h-8 rounded-[10px] bg-primary/10 border border-primary/25 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" strokeWidth={2.5} />
          </div>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 pt-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                cn(
                  "group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-hover"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-[-14px] w-[3px] h-4 rounded-r-full bg-primary" />
                  )}
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Theme toggle + Project selector + Live status */}
        <div className="flex flex-col items-center gap-3 pb-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-all duration-150"
          >
            {isDark ? (
              <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
            ) : (
              <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            )}
          </button>

          {/* Project initial */}
          {projects.length > 0 && (
            <div className="relative" ref={popoverRef}>
              <button
                onClick={() => setProjectPopover(!projectPopover)}
                title={selectedProject ? selectedProject.name : "All Projects"}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wide transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: selectedProject
                    ? getProjectColor(selectedProject.name) + "20"
                    : "var(--hover)",
                  color: selectedProject
                    ? getProjectColor(selectedProject.name)
                    : "var(--muted-fg)",
                  border: `1.5px solid ${selectedProject ? getProjectColor(selectedProject.name) + "40" : "var(--border-c)"}`,
                }}
              >
                {selectedProject ? getInitials(selectedProject.name) : "ALL"}
              </button>

              {/* Project popover */}
              {projectPopover && (
                <div className="absolute bottom-0 left-[calc(100%+8px)] z-50 w-48 bg-surface border border-border/60 rounded-lg shadow-2xl shadow-black/20 py-1.5 animate-fade-up">
                  <div className="px-3 py-1.5 text-[10px] font-medium tracking-widest uppercase text-muted-foreground/50">
                    Projects
                  </div>
                  <button
                    onClick={() => {
                      setProjectId(null);
                      setProjectPopover(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[12px] flex items-center gap-2.5 hover:bg-hover transition-colors",
                      !selectedProjectId ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-hover border border-border/50 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                      *
                    </div>
                    All Projects
                    {!selectedProjectId && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                  {projects.map((project) => {
                    const color = getProjectColor(project.name);
                    return (
                      <button
                        key={project.id}
                        onClick={() => {
                          setProjectId(project.id);
                          setProjectPopover(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[12px] flex items-center gap-2.5 hover:bg-hover transition-colors",
                          selectedProjectId === project.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                          style={{
                            backgroundColor: color + "20",
                            color: color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {getInitials(project.name)}
                        </div>
                        {project.name}
                        {selectedProjectId === project.id && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Docs link */}
          <a
            href="https://meghshyams.github.io/ErrPulse/"
            target="_blank"
            rel="noopener noreferrer"
            title="Documentation"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-all"
          >
            <BookOpen className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </a>

          {/* Live indicator */}
          <div className="relative" title={connected ? "Connected" : "Disconnected"}>
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                connected ? "bg-success live-dot text-success" : "bg-destructive"
              )}
            />
            {liveCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 text-[9px] font-mono font-bold text-primary animate-fade-up">
                +{liveCount}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-11 flex items-center px-3 md:px-5 border-b border-border/40 bg-sidebar/50 flex-shrink-0">
          {/* Mobile brand mark */}
          <div className="md:hidden w-7 h-7 rounded-[8px] bg-primary/10 border border-primary/25 flex items-center justify-center mr-2.5">
            <Activity className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-medium text-foreground/80">{pageTitle}</span>
          {selectedProject && (
            <span className="ml-3 text-[11px] font-mono px-2 py-0.5 rounded-full bg-hover text-muted-foreground border border-border/40 hidden sm:inline">
              {selectedProject.name}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {liveCount > 0 && (
              <span className="text-[10px] font-mono text-primary/70 animate-fade-up">
                {liveCount} incoming
              </span>
            )}
            {/* Mobile theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-all duration-150"
            >
              {isDark ? (
                <Sun className="w-4 h-4" strokeWidth={1.8} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.8} />
              )}
            </button>
            {/* Mobile live indicator */}
            <div className="md:hidden relative" title={connected ? "Connected" : "Disconnected"}>
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  connected ? "bg-success live-dot text-success" : "bg-destructive"
                )}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-border/40 flex items-center justify-around h-14 safe-area-pb">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 min-w-[60px]",
                isActive ? "text-primary" : "text-muted-foreground/60 active:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 w-8 h-[3px] rounded-b-full bg-primary" />
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Docs link in mobile nav */}
        <a
          href="https://meghshyams.github.io/ErrPulse/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-muted-foreground/60 active:text-foreground min-w-[60px]"
        >
          <BookOpen className="w-5 h-5" strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Docs</span>
        </a>
      </nav>
    </div>
  );
}
