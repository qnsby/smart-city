import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import { ToastProvider } from "./components/ui/ToastProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MapPage } from "./pages/MapPage";
import { IssueDetailsPage } from "./pages/IssueDetailsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminIssuesPage } from "./pages/AdminIssuesPage";
import { USE_MSW } from "./utils/constants";
import "./index.css";

async function enableMocks() {
  if (!USE_MSW) return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <Navigate to="/map" replace /> },
          { path: "/map", element: <MapPage /> },
          { path: "/issue/:id", element: <IssueDetailsPage /> }
        ]
      }
    ]
  },
  {
    element: <ProtectedRoute roles={["dept_admin", "university_admin"]} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/admin/dashboard", element: <AdminDashboardPage /> },
          { path: "/admin/issues", element: <AdminIssuesPage /> }
        ]
      }
    ]
  },
  { path: "*", element: <Navigate to="/map" replace /> }
]);

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

enableMocks()
  .catch((error) => {
    console.warn("MSW failed to start. Continuing without mocks.", error);
  })
  .finally(renderApp);
