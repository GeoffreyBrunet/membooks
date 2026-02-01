import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="inline-block bg-coral text-gray-900 border-2 border-gray-900 rounded-xl px-6 py-3 neo-shadow-lg mb-8">
          <span className="font-title text-7xl">404</span>
        </div>
        <h1 className="font-title text-3xl text-gray-900 mb-4">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/library"
          className="inline-block px-6 py-3 bg-cyan text-gray-900 font-title text-lg border-2 border-gray-900 rounded-lg neo-shadow-md hover:translate-y-0.5 hover:shadow-none active:translate-y-1 transition-all"
        >
          Back to Library
        </Link>
      </div>
    </div>
  );
}
