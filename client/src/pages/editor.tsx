import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Copy, Check, Save, Download, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../components/ui/use-toast";
import { CodePreview } from "../components/code-preview";
import { FileUpload } from "../components/file-upload";
import { useGenerateCode } from "../hooks/use-api";
import { useAuth } from "../hooks/use-auth";
import {
  useCreateProject,
  useCreateSnippet,
  useProjects,
} from "../hooks/use-api";

const Editor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState("GEMINI");
  const [language, setLanguage] = useState("");
  const [framework, setFramework] = useState("");
  const [result, setResult] = useState<{
    code: string;
    language: string;
    explanation?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveDetails, setSaveDetails] = useState({
    projectId: "",
    createNew: true,
    projectName: "",
    snippetTitle: "",
    snippetDescription: "",
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // API hooks
  const generateCodeMutation = useGenerateCode();
  const createProjectMutation = useCreateProject();
  const createSnippetMutation = useCreateSnippet();
  const { data: projectsData } = useProjects();

  const handleGenerateCode = async () => {
    if (!prompt.trim() && !selectedFile) {
      toast({
        title: "Empty Prompt",
        description:
          "Please enter a prompt or upload an image to generate code.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedFile) {
        await handleImageUpload(selectedFile);
      } else {
        const response = await generateCodeMutation.mutateAsync({
          prompt,
          provider,
          language: language || undefined,
          framework: framework || undefined,
        });

        setResult(response.result);
      }
    } catch (error) {
      console.error("Error generating code:", error);
    }
  };

  const handleCopyCode = () => {
    if (result?.code) {
      navigator.clipboard.writeText(result.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast({
        title: "Copied to Clipboard",
        description: "Code has been copied to your clipboard",
      });
    }
  };

  const handleSaveSnippet = async () => {
    if (!result?.code) return;

    try {
      if (saveDetails.createNew) {
        // Create new project first
        const projectResponse = await createProjectMutation.mutateAsync({
          name: saveDetails.projectName,
          language: language || result.language || undefined,
          framework: framework || undefined,
        });

        // Then create snippet in the new project
        await createSnippetMutation.mutateAsync({
          projectId: projectResponse.project.id,
          data: {
            title: saveDetails.snippetTitle || "Generated Code",
            code: result.code,
            language: result.language,
            description: saveDetails.snippetDescription || prompt,
          },
        });

        toast({
          title: "Saved Successfully",
          description: `Code saved to new project "${saveDetails.projectName}"`,
        });

        // Navigate to the new project
        navigate(`/projects/${projectResponse.project.id}`);
      } else {
        // Create snippet in existing project
        await createSnippetMutation.mutateAsync({
          projectId: saveDetails.projectId,
          data: {
            title: saveDetails.snippetTitle || "Generated Code",
            code: result.code,
            language: result.language,
            description: saveDetails.snippetDescription || prompt,
          },
        });

        toast({
          title: "Saved Successfully",
          description: "Code saved to existing project",
        });

        // Navigate to the project
        navigate(`/projects/${saveDetails.projectId}`);
      }

      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving snippet:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save the code snippet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsProcessingImage(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("prompt", prompt || "Generate code based on this image");
      formData.append("provider", provider);

      // Use the API directly since we need to handle FormData
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/llm/upload-image`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      setResult(data.result);

      toast({
        title: "Image Processed",
        description: "Code has been generated based on the uploaded image",
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDownloadCode = () => {
    if (!result?.code) return;

    const blob = new Blob([result.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-code.${result.language || "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Code has been downloaded as a file",
    });
  };

  // Check if user can use premium models
  const isPremiumUser = user?.plan === "PREMIUM";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Code Generation</CardTitle>
            <CardDescription>
              Describe what code you want to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe the code you want to generate... e.g., 'Create a responsive navbar with HTML and CSS' or 'Generate a React component for a todo list'"
              className="min-h-[200px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GEMINI">Google Gemini</SelectItem>
                    <SelectItem value="OPENAI" disabled={!isPremiumUser}>
                      OpenAI GPT-4 {!isPremiumUser && "(Premium)"}
                    </SelectItem>
                    <SelectItem value="CLAUDE" disabled={!isPremiumUser}>
                      Anthropic Claude {!isPremiumUser && "(Premium)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language (Optional)</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Any Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Language</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="jsx">React JSX</SelectItem>
                    <SelectItem value="tsx">React TSX</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="swift">Swift</SelectItem>
                    <SelectItem value="kotlin">Kotlin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="framework">Framework (Optional)</Label>
                <Select value={framework} onValueChange={setFramework}>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Any Framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Framework</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                    <SelectItem value="django">Django</SelectItem>
                    <SelectItem value="flask">Flask</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="laravel">Laravel</SelectItem>
                    <SelectItem value="rails">Ruby on Rails</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FileUpload
              onFileSelect={(file) => setSelectedFile(file)}
              accept="image/*"
              maxSize={5}
              buttonText="Upload Image"
              className="mt-4"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={handleGenerateCode}
              disabled={
                (!prompt.trim() && !selectedFile) ||
                generateCodeMutation.isPending ||
                isProcessingImage
              }
            >
              {generateCodeMutation.isPending || isProcessingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isProcessingImage ? "Processing Image..." : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        {result ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Generated Code</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCode}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyCode}>
                    {isCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Dialog
                    open={isSaveDialogOpen}
                    onOpenChange={setIsSaveDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Code Snippet</DialogTitle>
                        <DialogDescription>
                          Save this code to a new or existing project.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Project</Label>
                          <Tabs
                            defaultValue="new"
                            value={saveDetails.createNew ? "new" : "existing"}
                            onValueChange={(value) =>
                              setSaveDetails({
                                ...saveDetails,
                                createNew: value === "new",
                              })
                            }
                          >
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="new">New Project</TabsTrigger>
                              <TabsTrigger value="existing">
                                Existing Project
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="new" className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="projectName">
                                  Project Name
                                </Label>
                                <Input
                                  id="projectName"
                                  placeholder="My New Project"
                                  value={saveDetails.projectName}
                                  onChange={(e) =>
                                    setSaveDetails({
                                      ...saveDetails,
                                      projectName: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </TabsContent>
                            <TabsContent
                              value="existing"
                              className="space-y-4 pt-4"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="projectId">
                                  Select Project
                                </Label>
                                <Select
                                  value={saveDetails.projectId}
                                  onValueChange={(value) =>
                                    setSaveDetails({
                                      ...saveDetails,
                                      projectId: value,
                                    })
                                  }
                                >
                                  <SelectTrigger id="projectId">
                                    <SelectValue placeholder="Select a project" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projectsData?.projects?.map(
                                      (project: any) => (
                                        <SelectItem
                                          key={project.id}
                                          value={project.id}
                                        >
                                          {project.name}
                                        </SelectItem>
                                      )
                                    ) || (
                                      <SelectItem value="no-projects" disabled>
                                        No projects found
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="snippetTitle">Snippet Title</Label>
                          <Input
                            id="snippetTitle"
                            placeholder="Generated Code"
                            value={saveDetails.snippetTitle}
                            onChange={(e) =>
                              setSaveDetails({
                                ...saveDetails,
                                snippetTitle: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="snippetDescription">
                            Description (Optional)
                          </Label>
                          <Textarea
                            id="snippetDescription"
                            placeholder="A brief description of this code snippet"
                            value={saveDetails.snippetDescription || prompt}
                            onChange={(e) =>
                              setSaveDetails({
                                ...saveDetails,
                                snippetDescription: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsSaveDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveSnippet}
                          disabled={
                            createSnippetMutation.isPending ||
                            createProjectMutation.isPending
                          }
                        >
                          {createSnippetMutation.isPending ||
                          createProjectMutation.isPending
                            ? "Saving..."
                            : "Save Snippet"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {result.language && (
                <CardDescription>Language: {result.language}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <CodePreview
                code={result.code}
                language={result.language}
                showPreview={true}
                title={
                  result.language === "html"
                    ? "HTML Preview"
                    : result.language === "css"
                    ? "CSS Preview"
                    : result.language === "javascript" ||
                      result.language === "js"
                    ? "JavaScript Preview"
                    : result.language === "jsx" || result.language === "tsx"
                    ? "React Preview"
                    : result.language === "typescript" ||
                      result.language === "ts"
                    ? "TypeScript Preview"
                    : "Code Preview"
                }
              />
            </CardContent>
            {result.explanation && (
              <CardFooter className="flex-col items-start border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Explanation</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {result.explanation}
                </p>
              </CardFooter>
            )}
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                No Code Generated Yet
              </h3>
              <p className="text-center text-muted-foreground max-w-md mb-4">
                Enter a prompt and click "Generate Code" to create code using
                AI. You can also upload an image to generate code based on its
                content.
              </p>
              {!isPremiumUser && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-amber-800 dark:text-amber-200 text-sm mt-2">
                  <p className="font-medium">Premium Features Available</p>
                  <p className="text-xs mt-1">
                    Upgrade to Premium to access OpenAI and Claude models for
                    more advanced code generation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Editor;
