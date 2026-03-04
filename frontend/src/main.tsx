import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// Guest pages
import RootLayout from "./root-layout/Root-layout";
import Homepage from "./route/homepage/App";
import Bulletin from "./route/bulletin/Bulletin";
import Officers from "./route/officers/Officers";

// Admin Login (Public)
import Login from "./admin/admin-loginpage/login/Login";
import Forgot from "./admin/admin-loginpage/forgot/Forgot";
import AdminPage from "./admin/AdminPage";

const router = createBrowserRouter([
  // Guest Routes
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Homepage /> },
      { path: "bulletin", element: <Bulletin /> },
      { path: "officers", element: <Officers /> },
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
  // Admin Protected Routes
  {
    path: "/admin",
    element: <AdminPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// todo - fix the classnames
