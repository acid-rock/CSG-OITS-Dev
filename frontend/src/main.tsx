import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";

// Public shell + landing page stay eager for fast first paint
import RootLayout from "./root-layout/Root-layout";
import Homepage from "./route/homepage/App";

// Guest pages (lazy)
const Bulletin = lazy(() => import("./route/bulletin/Bulletin"));
const DocumentsPage = lazy(() => import("./route/documents/Documents"));
const EventsPage = lazy(() => import("./route/events/Events"));
const Officers = lazy(() => import("./route/officers/Officers"));
const AboutPage = lazy(() => import("./route/about/AboutPage"));
const Borrow = lazy(() => import("./route/borrow/Borrow"));
const BorrowCheckout = lazy(() => import("./route/borrow/BorrowCheckout"));
const BorrowReservation = lazy(() => import("./route/borrow/BorrowReservation"));
const ContributorsPage = lazy(() => import("./route/contributors/Contributors"));
const OrganizationsPage = lazy(() => import("./route/organizations/OrganizationsPage"));

// Admin Login (Public, lazy)
const Login = lazy(() => import("./admin/admin-loginpage/login/Login"));
const Forgot = lazy(() => import("./admin/admin-loginpage/forgot/Forgot"));
const Reset = lazy(() => import("./admin/admin-loginpage/reset/Reset"));
const AdminPage = lazy(() => import("./admin/AdminPage"));
const ProtectedRoute = lazy(() => import("./admin/ProtectedRoute"));

// Logbook (standalone — no nav header, lazy)
const LogbookPage = lazy(() => import("./route/logbook/LogbookPage"));
const LogbookDisplay = lazy(() => import("./route/logbook/LogbookDisplay"));

// Public Office Hours (under RootLayout, lazy)
const OfficePage = lazy(() => import("./route/office/OfficePage"));

// Committee portal (lazy)
const CommitteeLogin = lazy(() => import("./route/committee-login/CommitteeLogin"));
const CommitteeAdminPage = lazy(() => import("./route/committee-admin/CommitteeAdminPage"));
const CommitteeProtectedRoute = lazy(
  () => import("./route/committee-admin/CommitteeProtectedRoute"),
);

const Fallback = (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <span aria-busy="true">Loading…</span>
  </div>
);

const router = createBrowserRouter([
  // Guest Routes
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Homepage /> },
      { path: "bulletin", element: <Bulletin /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "events", element: <EventsPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "officers", element: <Officers /> },
      { path: "borrow", element: <Borrow /> },
      { path: "borrow/checkout", element: <BorrowCheckout /> },
      { path: "borrow/:id", element: <BorrowReservation /> },
      { path: "contributors",  element: <ContributorsPage /> },
      { path: "organizations", element: <OrganizationsPage /> },
      { path: "office",        element: <OfficePage /> },
    ],
  },
  // Admin Public Routes (Login)
  {
    path: "/admin/login",
    element: <Login />,
  },
  {
    path: "/admin/forgot-password",
    element: <Forgot />,
  },
  // Password reset landing page — NOT wrapped in ProtectedRoute (user has no session cookie)
  {
    path: "/admin/reset-password",
    element: <Reset />,
  },
  // Admin Protected Routes
  {
    path: "/admin",
    element: <ProtectedRoute />,
    children: [{ index: true, element: <AdminPage /> }],
  },
  // /bin redirects into the admin panel with the bin panel active
  {
    path: "/bin",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/admin?panel=bin" replace /> },
    ],
  },
  // Logbook — standalone kiosk/mobile pages
  { path: "/logbook",         element: <LogbookPage /> },
  { path: "/logbook/display", element: <LogbookDisplay /> },

  // Committee Portal
  {
    path: "/committee/login",
    element: <CommitteeLogin />,
  },
  {
    path: "/committee/admin",
    element: (
      <CommitteeProtectedRoute>
        <CommitteeAdminPage />
      </CommitteeProtectedRoute>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={Fallback}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
);
