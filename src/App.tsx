import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ArtifactDetailPage } from "./pages/ArtifactDetailPage";
import { ArtifactsPage } from "./pages/ArtifactsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ReindexPage } from "./pages/ReindexPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "artifacts", element: <ArtifactsPage /> },
      { path: "artifacts/:id", element: <ArtifactDetailPage /> },
      { path: "admin/reindex", element: <ReindexPage /> },
      { path: "*", element: <Navigate to="/projects" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
