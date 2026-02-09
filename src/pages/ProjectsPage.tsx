import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createProject, listProjects } from "../api/memoryService";
import { toUiErrorMessage } from "../api/client";
import type { ProjectResponse } from "../types";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProjects(nameFilter);
  }, []);

  async function loadProjects(name?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects(name?.trim() ? name : undefined);
      setProjects(data);
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadProjects(nameFilter);
  }

  async function onCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createProject(trimmed);
      setNewProjectName("");
      await loadProjects(nameFilter);
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Projects</h2>
        <p>Create, search, and open project details.</p>
      </div>

      <form className="card form-grid" onSubmit={onSearchSubmit}>
        <label>
          Name filter
          <input
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
            placeholder="Part of project name"
          />
        </label>
        <button type="submit">Search</button>
      </form>

      <form className="card form-grid" onSubmit={onCreateProject}>
        <label>
          New project name
          <input
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            placeholder="e.g. Product Docs"
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create project"}
        </button>
      </form>

      {error && <p className="alert error">{error}</p>}
      {loading && <p className="info">Loading projects...</p>}
      {!loading && projects.length === 0 && <p className="info">No projects found.</p>}

      {!loading && projects.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.id}</td>
                  <td>
                    <Link to={`/projects/${project.id}`}>{project.name}</Link>
                  </td>
                  <td className="actions-cell">
                    <button type="button" disabled title="не поддерживается сервером">
                      Edit
                    </button>
                    <button type="button" disabled title="не поддерживается сервером">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
