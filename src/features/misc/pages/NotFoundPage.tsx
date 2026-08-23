import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "@/components/ui/Button";
import { PATHS } from "@/routes/paths";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="text-center">
        <p className="bg-gradient-to-br from-brand-600 to-brand-900 bg-clip-text text-8xl font-black tracking-tight text-transparent">
          404
        </p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          The page you're looking for doesn't exist or may have been moved to another module.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link to={PATHS.dashboard}>
            <Button>
              <Compass className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
