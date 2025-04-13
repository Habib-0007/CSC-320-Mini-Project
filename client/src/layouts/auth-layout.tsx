import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/theme-toggle";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} AI Code Generation Platform
      </footer>
    </div>
  );
};

export default AuthLayout;
