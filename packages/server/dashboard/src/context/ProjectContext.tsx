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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const setProjectId = useCallback((id: string | null) => {
    setSelectedProjectId(id);
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
