import { FormEvent, useEffect, useState } from "react";
import { listProjects, reindexProject } from "../api/memoryService";
import { toUiErrorMessage } from "../api/client";
import type { ArtifactStatus, ProjectResponse, ReindexResponse } from "../types";

const statuses: ArtifactStatus[] = ["APPROVED", "DRAFT", "DEPRECATED"];

export function ReindexPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<ArtifactStatus>("APPROVED");
  const [type, setType] = useState("");
  const [limit, setLimit] = useState("100");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReindexResponse | null>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
      if (data.length > 0) {
        setProjectId(String(data[0].id));
      }
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedProjectId = Number(projectId);
    const parsedLimit = Number(limit);
    if (!Number.isFinite(parsedProjectId)) {
      setError("Project is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const data = await reindexProject(parsedProjectId, {
        status,
        type: type.trim() || undefined,
        limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Admin reindex</h2>
        <p>Reindex artifacts for a selected project.</p>
      </div>

      {loading && <p className="info">Loading projects...</p>}

      <form className="card form-grid split" onSubmit={onSubmit}>
        <label>
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} required>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} (#{project.id})
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ArtifactStatus)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Type
          <input value={type} onChange={(event) => setType(event.target.value)} />
        </label>

        <label>
          Limit
          <input type="number" min={1} value={limit} onChange={(event) => setLimit(event.target.value)} />
        </label>

        <button type="submit" disabled={submitting || loading}>
          {submitting ? "Reindexing..." : "Start reindex"}
        </button>
      </form>

      {error && <p className="alert error">{error}</p>}

      {result && (
        <article className="card stacked">
          <h3>Reindex completed</h3>
          <div className="meta-grid">
            <span>Project: {result.projectId}</span>
            <span>Status: {result.status}</span>
            <span>Type: {result.type ?? "all"}</span>
            <span>Processed: {result.processed}</span>
            <span>Failed: {result.failed}</span>
          </div>
        </article>
      )}
    </section>
  );
}
