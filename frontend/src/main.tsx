import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";

// Guest pages
import RootLayout from "./root-layout/Root-layout";
import Homepage from "./route/homepage/App";
import Bulletin from "./route/bulletin/Bulletin";
import DocumentsPage from "./route/documents/Documents";
import EventsPage from "./route/events/Events";
import Officers from "./route/officers/Officers";
import AboutPage from "./route/about/AboutPage";
import Borrow from "./route/borrow/Borrow";
import BorrowReservation from "./route/borrow/BorrowReservation";
import ContributorsPage from "./route/contributors/Contributors";
import OrganizationsPage from "./route/organizations/OrganizationsPage";

// Admin Login (Public)
import Login from "./admin/admin-loginpage/login/Login";
import Forgot from "./admin/admin-loginpage/forgot/Forgot";
import Reset from "./admin/admin-loginpage/reset/Reset";
import AdminPage from "./admin/AdminPage";
import ProtectedRoute from "./admin/ProtectedRoute";

// Committee portal
import CommitteeLogin from "./route/committee-login/CommitteeLogin";
import CommitteeAdminPage from "./route/committee-admin/CommitteeAdminPage";
import CommitteeProtectedRoute from "./route/committee-admin/CommitteeProtectedRoute";

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
      { path: "borrow/:id", element: <BorrowReservation /> },
      { path: "contributors", element: <ContributorsPage /> },
      { path: "organizations", element: <OrganizationsPage /> },
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
    <RouterProvider router={router} />
  </StrictMode>,
);
