import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../api/memoryService";
import { toUiErrorMessage } from "../api/client";
import type { ProjectResponse } from "../types";

export function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      setError("Invalid project id.");
      setLoading(false);
      return;
    }
    void loadProject(id);
  }, [params.id]);

  async function loadProject(id: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Project details</h2>
        <p>Quick access to artifact search for this project.</p>
      </div>

      {loading && <p className="info">Loading project...</p>}
      {error && <p className="alert error">{error}</p>}

      {!loading && !error && project && (
        <article className="card project-card">
          <h3>{project.name}</h3>
          <p>Project ID: {project.id}</p>
          <Link className="cta-link" to={`/artifacts?projectId=${project.id}`}>
            Search artifacts in this project
          </Link>
        </article>
      )}
    </section>
  );
}
