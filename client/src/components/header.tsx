import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "../hooks/use-auth";
import { Badge } from "./ui/badge";

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [title, setTitle] = useState("");

  useEffect(() => {
    // Set page title based on current route
    switch (location.pathname) {
      case "/":
        setTitle("Dashboard");
        break;
      case "/editor":
        setTitle("Code Editor");
        break;
      case "/projects":
        setTitle("Projects");
        break;
      case "/settings":
        setTitle("Settings");
        break;
      case "/pricing":
        setTitle("Pricing");
        break;
      default:
        if (location.pathname.startsWith("/projects/")) {
          setTitle("Project Details");
        } else {
          setTitle("");
        }
    }
  }, [location]);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        {user?.plan === "PREMIUM" && (
          <Badge
            variant="default"
            className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black"
          >
            Premium
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 rounded-full bg-muted pl-8 focus-visible:ring-primary"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary"></span>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
