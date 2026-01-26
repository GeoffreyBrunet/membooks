import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, Link, redirect } from "@tanstack/react-router";

// Pages
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { LibraryPage } from "./pages/Library";
import { SearchPage } from "./pages/Search";
import { StatisticsPage } from "./pages/Statistics";
import { ProfilePage } from "./pages/Profile";
import { SubscriptionPage } from "./pages/Subscription";
import { AdminPage } from "./pages/Admin";
import { BookDetailPage } from "./pages/BookDetail";
import { SeriesDetailPage } from "./pages/SeriesDetail";

// Services
import { getSession } from "./services/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Auth check helper
const requireAuth = async () => {
  const session = getSession();
  if (!session) {
    throw redirect({ to: "/login" });
  }
  return session;
};

const requireGuest = async () => {
  const session = getSession();
  if (session) {
    throw redirect({ to: "/library" });
  }
  return null;
};

// Root Layout
function RootLayout() {
  const session = getSession();

  if (!session) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b-2 border-gray-900 neo-shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/library" className="font-title text-2xl text-coral hover:text-coral/80">
            Membooks
          </Link>
          <ul className="flex items-center gap-6">
            <li>
              <Link
                to="/library"
                className="font-medium text-gray-700 hover:text-coral transition-colors"
              >
                Library
              </Link>
            </li>
            <li>
              <Link
                to="/search"
                className="font-medium text-gray-700 hover:text-coral transition-colors"
              >
                Search
              </Link>
            </li>
            <li>
              <Link
                to="/statistics"
                className="font-medium text-gray-700 hover:text-coral transition-colors"
              >
                Statistics
              </Link>
            </li>
            <li>
              <Link
                to="/subscription"
                className="font-medium text-gray-700 hover:text-coral transition-colors"
              >
                Premium
              </Link>
            </li>
            <li>
              <Link
                to="/admin"
                className="font-medium text-gray-700 hover:text-coral transition-colors"
              >
                Admin
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.email}</span>
            <Link
              to="/profile"
              className="px-4 py-2 border-2 border-gray-900 rounded-lg font-title text-sm hover:bg-gray-100 transition-colors neo-shadow-sm hover:translate-y-0.5 hover:shadow-none"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// Routes
const rootRoute = createRootRoute({
  component: RootLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: requireGuest,
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: requireGuest,
  component: RegisterPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    throw redirect({ to: "/library" });
  },
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/library",
  beforeLoad: requireAuth,
  component: LibraryPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  beforeLoad: requireAuth,
  component: SearchPage,
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/statistics",
  beforeLoad: requireAuth,
  component: StatisticsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: requireAuth,
  component: ProfilePage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscription",
  beforeLoad: requireAuth,
  component: SubscriptionPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: requireAuth,
  component: AdminPage,
});

const bookDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/book/$bookId",
  beforeLoad: requireAuth,
  component: BookDetailPage,
});

const seriesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/series/$seriesId",
  beforeLoad: requireAuth,
  component: SeriesDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  libraryRoute,
  searchRoute,
  statisticsRoute,
  profileRoute,
  subscriptionRoute,
  adminRoute,
  bookDetailRoute,
  seriesDetailRoute,
]);

const router = createRouter({ routeTree });

// Render App
const root = createRoot(document.getElementById("root")!);
root.render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
