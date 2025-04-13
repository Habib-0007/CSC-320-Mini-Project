import type React from "react";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Code,
  Calendar,
  MoreHorizontal,
  Plus,
  Trash,
  Edit,
  Share2,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  useProject,
  useProjectSnippets,
  useCreateSnippet,
} from "../hooks/use-api";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CodePreview } from "../components/code-preview";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSnippet, setNewSnippet] = useState({
    title: "",
    code: "",
    language: "javascript",
    description: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch project details
  const {
    data: projectData,
    isLoading: isLoadingProject,
    isError: isProjectError,
  } = useProject(id || "");

  // Fetch project snippets
  const {
    data: snippetsData,
    isLoading: isLoadingSnippets,
    isError: isSnippetsError,
    refetch,
  } = useProjectSnippets(id || "", {
    page: currentPage,
    limit: 10,
  });

  // Create snippet mutation
  const createSnippetMutation = useCreateSnippet();

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await createSnippetMutation.mutateAsync({
        projectId: id,
        data: newSnippet,
      });
      setNewSnippet({
        title: "",
        code: "",
        language: "javascript",
        description: "",
      });
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error creating snippet:", error);
    }
  };

  const handleCopyCode = (snippetId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(snippetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  if (isLoadingProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/3 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-md" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isProjectError) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Failed to load project</h2>
        <p className="text-muted-foreground mb-4">
          There was an error loading the project details. Please try again.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate("/projects")}>
            Back to Projects
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const project = projectData?.project;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {project?.name}
              {project?.language && (
                <Badge variant="outline">{project.language}</Badge>
              )}
              {project?.framework && (
                <Badge variant="outline">{project.framework}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {project?.description || "No description provided"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Project</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share Project</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Snippet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Code Snippet</DialogTitle>
                <DialogDescription>
                  Add a new code snippet to your project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSnippet}>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Snippet Title"
                        value={newSnippet.title}
                        onChange={(e) =>
                          setNewSnippet({
                            ...newSnippet,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={newSnippet.language}
                        onValueChange={(value) =>
                          setNewSnippet({ ...newSnippet, language: value })
                        }
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
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
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                          <SelectItem value="shell">Shell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="A brief description of this code snippet"
                      value={newSnippet.description}
                      onChange={(e) =>
                        setNewSnippet({
                          ...newSnippet,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Textarea
                      id="code"
                      placeholder="Paste your code here..."
                      className="font-mono h-64"
                      value={newSnippet.code}
                      onChange={(e) =>
                        setNewSnippet({ ...newSnippet, code: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSnippetMutation.isPending}
                  >
                    {createSnippetMutation.isPending
                      ? "Creating..."
                      : "Create Snippet"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <form onSubmit={handleSearch} className="flex-1 sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search snippets..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {isLoadingSnippets ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-1/3 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-md" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : isSnippetsError ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Failed to load snippets
          </h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the code snippets. Please try again.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      ) : snippetsData?.snippets.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No code snippets found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? `No snippets matching "${searchQuery}"`
              : "You haven't added any code snippets to this project yet."}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Add Snippet
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {snippetsData?.snippets.map((snippet: any) => (
              <Card key={snippet.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {snippet.title}
                        <Badge variant="outline">{snippet.language}</Badge>
                      </CardTitle>
                      {snippet.description && (
                        <CardDescription>{snippet.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleCopyCode(snippet.id, snippet.code)
                          }
                        >
                          {copiedId === snippet.id ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Snippet</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete Snippet</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <CodePreview
                    code={snippet.code}
                    language={snippet.language}
                    showPreview={true}
                    title={snippet.title}
                  />
                </CardContent>
                <CardFooter className="flex justify-between border-t p-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>
                      {snippet.updatedAt
                        ? `Updated ${formatDistanceToNow(
                            new Date(snippet.updatedAt),
                            { addSuffix: true }
                          )}`
                        : "Just created"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleCopyCode(snippet.id, snippet.code)}
                  >
                    {copiedId === snippet.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {snippetsData?.pagination && snippetsData.pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: snippetsData.pagination.pages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === snippetsData.pagination.pages}
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, snippetsData.pagination.pages)
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectDetail;
