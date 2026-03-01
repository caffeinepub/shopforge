import { Toaster } from "@/components/ui/sonner";
import { Outlet, RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";

import CreateStorePage from "./pages/CreateStorePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MembershipPage from "./pages/MembershipPage";
import NoStorePage from "./pages/NoStorePage";
import StorefrontPage from "./pages/StorefrontPage";
import StoresPage from "./pages/StoresPage";
// Pages
import WelcomePage from "./pages/WelcomePage";

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster richColors position="top-right" />
      <Outlet />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: WelcomePage,
});

const membershipRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/membership",
  component: MembershipPage,
});

const storesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stores",
  component: StoresPage,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/store/$slug",
  component: StorefrontPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const createStoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create-store",
  component: CreateStorePage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const noStoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard/no-store",
  component: NoStorePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  membershipRoute,
  storesRoute,
  storeRoute,
  loginRoute,
  createStoreRoute,
  dashboardRoute,
  noStoreRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
