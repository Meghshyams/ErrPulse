import React, { createContext, useContext, useState, useCallback } from "react";
import { useProjects, type Project } from "../hooks/useProjects";

interface ProjectContextValue {
  projects: Project[];
  selectedProjectId: string | null;
  setProjectId: (id: string | null) => void;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  selectedProjectId: null,
  setProjectId: () => {},
  loading: true,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { projects, loading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("errpulse_selected_project") || null;
    } catch {
      return null;
    }
  });

  const setProjectId = useCallback((id: string | null) => {
    setSelectedProjectId(id);
    try {
      if (id) {
        localStorage.setItem("errpulse_selected_project", id);
      } else {
        localStorage.removeItem("errpulse_selected_project");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, selectedProjectId, setProjectId, loading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
