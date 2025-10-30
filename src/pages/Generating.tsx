import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { useProjects } from "@/contexts/ProjectsContext";
import { useNavigate } from "react-router-dom";
import { Project } from "@/types/project";

const Generating: React.FC = () => {
  const { currentJob } = useProjects();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!currentJob) {
      navigate("/dashboard");
      return;
    }

    // Poll real job status from backend
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/jobs/${currentJob.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        
        const job = await response.json();
        
        // Update progress
        setProgress(job.progress);
        
        // Update current step based on progress
        if (job.progress < 25) setCurrentStep(0);
        else if (job.progress < 50) setCurrentStep(1);
        else if (job.progress < 75) setCurrentStep(2);
        else setCurrentStep(3);
        
        // Check if completed
        if (job.status === 'completed') {
          clearInterval(pollInterval);
          
          // Navigate to result page
          setTimeout(() => {
            navigate(`/result/${job.projectId}`);
          }, 500);
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          console.error('Job failed:', job.errorText);
          navigate("/dashboard");
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [currentJob, navigate]);

  if (!currentJob) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            Your video is being generated ⏰
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {currentJob.steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <span
                className={`flex-1 ${
                  index <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground">
          You can leave this page; generation continues in background…
        </p>
      </div>
    </div>
  );
};

export default Generating;
