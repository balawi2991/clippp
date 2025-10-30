import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Settings, Sparkles } from "lucide-react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ScriptEstimator } from "@/components/dashboard/ScriptEstimator";
import { useProjects } from "@/contexts/ProjectsContext";
import { useNavigate } from "react-router-dom";
import { InputMode } from "@/types/project";

const Dashboard: React.FC = () => {
  const { projects, createProject, startGeneration, pollJob, deleteProject, isLoading } = useProjects();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  // Input state
  const [inputMode, setInputMode] = useState<InputMode>("prompt");
  const [inputText, setInputText] = useState("");
  
  // Settings state
  const [language, setLanguage] = useState("EN");
  const [music, setMusic] = useState("upbeat");
  const [imageStyle, setImageStyle] = useState("stock-images");
  const [voice, setVoice] = useState("female");
  const [scriptStyle, setScriptStyle] = useState("default");
  const [targetLength, setTargetLength] = useState(45);
  const [captions, setCaptions] = useState(true);
  const [watermark, setWatermark] = useState(true);

  // Project filter
  const [projectFilter, setProjectFilter] = useState<"my" | "tutorial" | "example">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      return;
    }

    setIsGenerating(true);

    try {
      let finalScript = inputText;
      
      // If Prompt mode, generate script from AI
      if (inputMode === "prompt") {
        toast({
          title: "Generating script...",
          description: "AI is writing your script",
        });
        
        const response = await fetch('http://localhost:3001/api/scripts/generate-from-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: inputText,
            targetDuration: targetLength,
            style: scriptStyle,
            language
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate script');
        }
        
        const data = await response.json();
        finalScript = data.script;
        
        toast({
          title: "Script generated!",
          description: `${data.wordCount} words ≈ ${data.estimatedDuration}s`,
        });
      }
      
      // Create project with final script
      const projectId = await createProject(
        "Generated Video",
        finalScript,
        {
          language,
          music,
          imageStyle,
          voice,
          scriptStyle,
          targetLength,
          captions,
          watermark,
        }
      );

      if (!projectId) {
        setIsGenerating(false);
        return;
      }

      // Start generation
      const jobId = await startGeneration(projectId);

      if (!jobId) {
        setIsGenerating(false);
        return;
      }

      // Navigate to generating page
      navigate("/generating");

      // Poll job in background
      pollJob(jobId).then(() => {
        // Navigate to result when done
        navigate(`/result/${projectId}`);
      }).catch(() => {
        setIsGenerating(false);
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const getPlaceholder = () => {
    if (inputMode === "prompt") {
      return "Enter video topic (e.g., motivation, success tips, productivity)";
    }
    return "Paste your script here.";
  };

  const charCount = inputText.length;
  const minChars = 100;
  const maxChars = 800;

  const handleRandomScript = async () => {
    setIsLoadingScript(true);
    const { data, error } = await import("@/lib/api").then((m) => m.getRandomScript());
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else if (data) {
      setInputText(data.script);
      toast({
        title: "Random script inserted",
        description: "You can edit it before generating.",
      });
    }
    
    setIsLoadingScript(false);
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    // Filter by category
    if (projectFilter === "tutorial" && !project.id.startsWith("tutorial")) return false;
    if (projectFilter === "example" && !project.id.startsWith("example")) return false;
    if (projectFilter === "my" && (project.id.startsWith("tutorial") || project.id.startsWith("example"))) return false;

    // Filter by search
    if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-6 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <h1 className="text-xl font-bold">Visual Voicemail Maker</h1>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-[1800px] mx-auto space-y-8">
          {/* Generator Section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            {/* Tabs */}
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="prompt">Prompt to video</TabsTrigger>
                <TabsTrigger value="script">Use my own script</TabsTrigger>
                <TabsTrigger value="article" disabled className="opacity-50">
                  Article to video
                </TabsTrigger>
              </TabsList>

              <TabsContent value={inputMode} className="space-y-4">
                {/* Input Area */}
                <div>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">
                      {charCount} / {minChars}-{maxChars} characters
                    </span>
                    {inputMode === "script" && inputText.trim() && (
                      <ScriptEstimator script={inputText} targetDuration={targetLength} />
                    )}
                  </div>
                </div>

                {/* Settings Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Language */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">EN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Music */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Music</Label>
                    <Select value={music} onValueChange={setMusic}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="upbeat">Upbeat</SelectItem>
                        <SelectItem value="chill">Chill</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Style */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Image style</Label>
                    <Select value={imageStyle} onValueChange={setImageStyle}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock-video">Stock video</SelectItem>
                        <SelectItem value="stock-images">Stock images</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Voice</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Script Style */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Script style</Label>
                    <Select value={scriptStyle} onValueChange={setScriptStyle}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="promo">Promo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Settings Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm mb-2 block">Target length</Label>
                          <Select
                            value={targetLength.toString()}
                            onValueChange={(v) => setTargetLength(parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30s</SelectItem>
                              <SelectItem value="45">45s</SelectItem>
                              <SelectItem value="60">60s</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Captions</Label>
                          <Switch checked={captions} onCheckedChange={setCaptions} />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={charCount < minChars || charCount > maxChars || isGenerating}
                    className="bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {isGenerating ? "Generating..." : "Generate video"}
                  </Button>

                  <Button
                    onClick={handleRandomScript}
                    disabled={isLoadingScript}
                    variant="outline"
                    size="lg"
                  >
                    {isLoadingScript ? "Loading..." : "Random Script"}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Switch checked={watermark} onCheckedChange={setWatermark} />
                    <Label className="text-sm">Enable watermark</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Tabs value={projectFilter} onValueChange={(v) => setProjectFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="my">My projects</TabsTrigger>
                  <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
                  <TabsTrigger value="example">Example video</TabsTrigger>
                </TabsList>
              </Tabs>

              <Input
                placeholder="Type here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  thumbnail={project.thumbnail}
                  duration={project.duration}
                  onDelete={deleteProject}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No projects found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
