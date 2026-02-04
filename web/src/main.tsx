import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
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
import { NotFoundPage } from "./pages/NotFound";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicy";
import { TermsPage } from "./pages/Terms";

// Services
import { getProfile, User } from "./services/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Auth check helper - checks session via API
const requireAuth = async () => {
  const result = await getProfile();
  if (!result.success) {
    throw redirect({ to: "/login" });
  }
  return result.user;
};

const requireGuest = async () => {
  const result = await getProfile();
  if (result.success) {
    throw redirect({ to: "/library" });
  }
  return null;
};

// Root Layout
function RootLayout() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const result = await getProfile();
      return result.success ? result.user! : null;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!user) {
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
            <span className="text-sm text-gray-600">{user.email}</span>
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
  notFoundComponent: NotFoundPage,
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

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPolicyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
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
  privacyRoute,
  termsRoute,
]);

const router = createRouter({ routeTree });

// Render App
const root = createRoot(document.getElementById("root")!);
root.render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
