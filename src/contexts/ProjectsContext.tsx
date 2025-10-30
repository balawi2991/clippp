import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Project, GenerationJob } from "@/types/project";
import { toast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

interface ProjectsContextType {
  projects: Project[];
  currentJob: GenerationJob | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (title: string, script: string, settings?: any) => Promise<string | null>;
  getProject: (id: string) => Project | undefined;
  deleteProject: (id: string) => Promise<void>;
  startGeneration: (projectId: string) => Promise<string | null>;
  startExport: (projectId: string) => Promise<string | null>;
  pollJob: (jobId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// Sample projects
const SAMPLE_PROJECTS: Project[] = [
  {
    id: "tutorial-1",
    title: "Tutorial: Getting Started",
    duration: 39,
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=711&fit=crop",
    createdAt: new Date(Date.now() - 86400000),
    prompt: "Tutorial video",
    settings: {
      language: "EN",
      music: "upbeat",
      imageStyle: "stock-video",
      voice: "female",
      scriptStyle: "default",
      targetLength: 45,
      captions: true,
      watermark: true,
    },
  },
  {
    id: "example-1",
    title: "Product Launch Video",
    duration: 45,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=711&fit=crop",
    createdAt: new Date(Date.now() - 172800000),
    prompt: "Product launch example",
    settings: {
      language: "EN",
      music: "dramatic",
      imageStyle: "stock-images",
      voice: "male",
      scriptStyle: "promo",
      targetLength: 45,
      captions: true,
      watermark: true,
    },
  },
  {
    id: "example-2",
    title: "Educational Content",
    duration: 60,
    thumbnail: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=711&fit=crop",
    createdAt: new Date(Date.now() - 259200000),
    prompt: "Educational video example",
    settings: {
      language: "EN",
      music: "chill",
      imageStyle: "stock-video",
      voice: "neutral",
      scriptStyle: "default",
      targetLength: 60,
      captions: true,
      watermark: true,
    },
  },
];

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await api.getProjects();
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      // Convert API projects to our format
      const convertedProjects = data.map((p: any) => ({
        id: p.id,
        title: p.title,
        duration: 45, // Default
        thumbnail: undefined,
        createdAt: new Date(p.createdAt),
        prompt: undefined,
        settings: p.settings,
      }));
      setProjects([...SAMPLE_PROJECTS, ...convertedProjects]);
    }
    
    setIsLoading(false);
  }, []);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create project
  const createProject = useCallback(async (title: string, script: string, settings?: any) => {
    const { data, error } = await api.createProject({ title, script, settings });
    
    if (error) {
      toast({
        title: "Error creating project",
        description: error,
        variant: "destructive",
      });
      return null;
    }
    
    if (data) {
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
      await fetchProjects();
      return data.id;
    }
    
    return null;
  }, [fetchProjects]);

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    const { error } = await api.deleteProject(id);
    
    if (error) {
      toast({
        title: "Error deleting project",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Project deleted",
        description: "The project has been removed.",
      });
      await fetchProjects();
    }
  }, [fetchProjects]);

  // Start generation
  const startGeneration = useCallback(async (projectId: string) => {
    const { data, error } = await api.generateProject(projectId);
    
    if (error) {
      toast({
        title: "Error starting generation",
        description: error,
        variant: "destructive",
      });
      return null;
    }
    
    if (data) {
      const job: GenerationJob = {
        id: data.jobId,
        progress: 0,
        status: "processing",
        steps: data.job.steps,
      };
      setCurrentJob(job);
      return data.jobId;
    }
    
    return null;
  }, []);

  // Start export
  const startExport = useCallback(async (projectId: string) => {
    const { data, error } = await api.exportProject(projectId);
    
    if (error) {
      toast({
        title: "Error starting export",
        description: error,
        variant: "destructive",
      });
      return null;
    }
    
    if (data) {
      const job: GenerationJob = {
        id: data.jobId,
        progress: 0,
        status: "processing",
        steps: data.job.steps,
      };
      setCurrentJob(job);
      return data.jobId;
    }
    
    return null;
  }, []);

  // Poll job progress
  const pollJob = useCallback(async (jobId: string) => {
    try {
      await api.pollJob(jobId, (job) => {
        setCurrentJob({
          id: job.id,
          progress: job.progress,
          status: job.status === "completed" ? "completed" : "processing",
          steps: job.steps,
        });
      });
      
      // Job completed
      setCurrentJob((prev) => prev ? { ...prev, status: "completed" } : null);
    } catch (error) {
      toast({
        title: "Job failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setCurrentJob(null);
    }
  }, []);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        currentJob,
        isLoading,
        fetchProjects,
        createProject,
        getProject,
        deleteProject,
        startGeneration,
        startExport,
        pollJob,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return context;
};
