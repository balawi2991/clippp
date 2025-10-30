/**
 * API Client for Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Generic fetch wrapper
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { error: error.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// ============================================================================
// Projects API
// ============================================================================

export interface Project {
  id: string;
  title: string;
  status: string;
  durationLimit: number;
  style: any;
  settings: any;
  createdAt: string;
  updatedAt: string;
  scenes?: Scene[];
  captions?: Caption[];
  assets?: Asset[];
  jobs?: Job[];
}

export interface Scene {
  id: string;
  projectId: string;
  index: number;
  text: string;
  duration: number;
  startTime: number;
  endTime: number;
  imagePrompt?: string;
  imagePath?: string;
}

export interface Caption {
  id: string;
  projectId: string;
  index: number;
  text: string;
  startTime: number;
  endTime: number;
  words?: Array<{ w: string; s: number; e: number }>;
  overlayPath?: string;
}

export interface Asset {
  id: string;
  projectId: string;
  kind: string;
  path: string;
  filename: string;
  mimeType?: string;
  size?: number;
}

export interface Job {
  id: string;
  projectId: string;
  type: string;
  status: string;
  progress: number;
  currentStep?: string;
  steps: Array<{ id: string; label: string; completed: boolean }>;
  logs?: Array<{ timestamp: string; level: string; message: string }>;
  errorText?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<ApiResponse<Project[]>> {
  return fetchApi<Project[]>('/projects');
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<ApiResponse<Project>> {
  return fetchApi<Project>(`/projects/${id}`);
}

/**
 * Create new project
 */
export async function createProject(data: {
  title: string;
  script: string;
  settings?: any;
  style?: any;
}): Promise<ApiResponse<Project>> {
  return fetchApi<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update project
 */
export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<ApiResponse<Project>> {
  return fetchApi<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Start generation
 */
export async function generateProject(
  id: string
): Promise<ApiResponse<{ message: string; jobId: string; job: Job }>> {
  return fetchApi<{ message: string; jobId: string; job: Job }>(
    `/projects/${id}/generate`,
    {
      method: 'POST',
    }
  );
}

/**
 * Start export
 */
export async function exportProject(
  id: string
): Promise<ApiResponse<{ message: string; jobId: string; job: Job }>> {
  return fetchApi<{ message: string; jobId: string; job: Job }>(
    `/projects/${id}/export`,
    {
      method: 'POST',
    }
  );
}

// ============================================================================
// Jobs API
// ============================================================================

/**
 * Get job by ID
 */
export async function getJob(id: string): Promise<ApiResponse<Job>> {
  return fetchApi<Job>(`/jobs/${id}`);
}

/**
 * Poll job until completion
 */
export async function pollJob(
  jobId: string,
  onProgress?: (job: Job) => void,
  interval: number = 2000
): Promise<Job> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      const { data, error } = await getJob(jobId);

      if (error) {
        reject(new Error(error));
        return;
      }

      if (!data) {
        reject(new Error('No job data'));
        return;
      }

      if (onProgress) {
        onProgress(data);
      }

      if (data.status === 'completed') {
        resolve(data);
      } else if (data.status === 'failed') {
        reject(new Error(data.errorText || 'Job failed'));
      } else {
        setTimeout(poll, interval);
      }
    };

    poll();
  });
}

// ============================================================================
// Scripts API
// ============================================================================

/**
 * Get random script
 */
export async function getRandomScript(): Promise<ApiResponse<{ script: string }>> {
  return fetchApi<{ script: string }>('/scripts/random');
}

// ============================================================================
// Uploads API
// ============================================================================

/**
 * Upload file
 */
export async function uploadFile(file: File): Promise<ApiResponse<{
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}>> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      return { error: error.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Upload Error:', error);
    return { error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check API health
 */
export async function checkHealth(): Promise<ApiResponse<{
  status: string;
  timestamp: string;
  features: Record<string, boolean>;
}>> {
  return fetchApi('/health');
}
