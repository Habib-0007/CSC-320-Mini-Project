import { useState } from "react";
import { Link } from "react-router-dom";
import { Code, FolderKanban, Clock, ArrowRight, Zap, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../hooks/use-auth";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const recentProjects = [
    {
      id: "1",
      name: "React Dashboard",
      language: "TypeScript",
      updatedAt: "2 hours ago",
    },
    {
      id: "2",
      name: "API Integration",
      language: "JavaScript",
      updatedAt: "1 day ago",
    },
    {
      id: "3",
      name: "Mobile App",
      language: "React Native",
      updatedAt: "3 days ago",
    },
  ];

  const recentSnippets = [
    {
      id: "1",
      title: "Authentication Flow",
      language: "TypeScript",
      createdAt: "5 hours ago",
    },
    {
      id: "2",
      title: "Data Fetching Hook",
      language: "JavaScript",
      createdAt: "2 days ago",
    },
    {
      id: "3",
      title: "Animation Component",
      language: "CSS",
      createdAt: "4 days ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || "Developer"}!
          </p>
        </div>
        <Button asChild>
          <Link to="/editor">
            <Zap className="mr-2 h-4 w-4" />
            New Code Generation
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger
            value="overview"
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            onClick={() => setActiveTab("projects")}
          >
            Projects
          </TabsTrigger>
          <TabsTrigger
            value="snippets"
            onClick={() => setActiveTab("snippets")}
          >
            Snippets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Projects
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Code Snippets
                </CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">36</div>
                <p className="text-xs text-muted-foreground">
                  +8 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Usage</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">
                  of monthly quota
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your recently updated projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.language}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{project.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/projects">
                    View All Projects
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Snippets</CardTitle>
                <CardDescription>
                  Your recently created code snippets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium leading-none">
                        {snippet.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {snippet.language}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{snippet.createdAt}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/editor">
                    Create New Snippet
                    <Plus className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Projects</CardTitle>
                <Button asChild size="sm">
                  <Link to="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Manage your code projects and repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Project list would go here */}
              <div className="rounded-md border">
                <div className="p-4">
                  <div className="font-medium">React Dashboard</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    A responsive dashboard built with React and Tailwind CSS
                  </div>
                </div>
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      <span>TypeScript</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated 2 hours ago</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/projects/1">View</Link>
                  </Button>
                </div>
              </div>

              {/* More projects would be listed here */}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/projects">
                  View All Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="snippets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Snippets</CardTitle>
                <Button asChild size="sm">
                  <Link to="/editor">
                    <Plus className="mr-2 h-4 w-4" />
                    New Snippet
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Browse and manage your saved code snippets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Snippet list would go here */}
              <div className="rounded-md border">
                <div className="p-4">
                  <div className="font-medium">Authentication Flow</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Complete authentication flow with JWT and refresh tokens
                  </div>
                </div>
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Code className="h-4 w-4" />
                      <span>TypeScript</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Created 5 hours ago</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/projects/1/snippets/1">View</Link>
                  </Button>
                </div>
              </div>

              {/* More snippets would be listed here */}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/projects">
                  Browse All Snippets
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
