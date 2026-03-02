import { NavLink, Outlet } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useProject } from "../context/ProjectContext";
import { useState, useCallback } from "react";
import { LayoutDashboard, AlertTriangle, Globe, Zap, ChevronDown, FolderOpen } from "lucide-react";
import { cn } from "../lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/errors", icon: AlertTriangle, label: "Errors" },
  { to: "/requests", icon: Globe, label: "Requests" },
];

export function Layout() {
  const [liveCount, setLiveCount] = useState(0);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const { projects, selectedProjectId, setProjectId } = useProject();

  const handleMessage = useCallback(() => {
    setLiveCount((c) => c + 1);
    setTimeout(() => setLiveCount((c) => Math.max(0, c - 1)), 3000);
  }, []);

  const { connected } = useWebSocket(handleMessage);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border/50 bg-card/50 flex flex-col">
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border/50">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">
            Err<span className="text-primary">Lens</span>
          </span>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-foreground">
                  {selectedProject ? selectedProject.name : "All Projects"}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0 transition-transform",
                    projectDropdownOpen && "rotate-180"
                  )}
                />
              </button>
              {projectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProjectDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card border border-border/50 rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setProjectId(null);
                        setProjectDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted/50 transition-colors",
                        !selectedProjectId ? "text-primary font-medium" : "text-muted-foreground"
                      )}
                    >
                      All Projects
                    </button>
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setProjectId(project.id);
                          setProjectDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted/50 transition-colors",
                          selectedProjectId === project.id
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Connection status */}
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                connected ? "bg-success live-dot text-success" : "bg-destructive"
              )}
            />
            <span className="text-[11px] text-muted-foreground font-mono">
              {connected ? "LIVE" : "DISCONNECTED"}
            </span>
            {liveCount > 0 && (
              <span className="ml-auto text-[10px] font-mono text-primary animate-fade-up">
                +{liveCount}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
