import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createArtifact, listProjects, searchArtifacts } from "../api/memoryService";
import { toUiErrorMessage } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import type {
  ArtifactSearchItem,
  ArtifactSearchMode,
  ArtifactStatus,
  ProjectResponse,
} from "../types";

const artifactStatuses: ArtifactStatus[] = ["APPROVED", "DRAFT", "DEPRECATED"];
const searchModes: ArtifactSearchMode[] = ["LIKE", "VECTOR", "HYBRID"];

export function ArtifactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId = searchParams.get("projectId") ?? "";

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ArtifactStatus>("APPROVED");
  const [type, setType] = useState("");
  const [mode, setMode] = useState<ArtifactSearchMode | "">("");
  const [topK, setTopK] = useState("5");
  const [maxSnippetLength, setMaxSnippetLength] = useState("240");
  const [results, setResults] = useState<ArtifactSearchItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searching, setSearching] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [newArtifactProjectId, setNewArtifactProjectId] = useState(initialProjectId);
  const [newArtifactType, setNewArtifactType] = useState("");
  const [newArtifactTitle, setNewArtifactTitle] = useState("");
  const [newArtifactContent, setNewArtifactContent] = useState("");

  useEffect(() => {
    void loadProjects();
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === projectId),
    [projects, projectId],
  );

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const data = await listProjects();
      setProjects(data);
      if (!initialProjectId && data.length > 0) {
        setProjectId(String(data[0].id));
        setNewArtifactProjectId(String(data[0].id));
      }
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setLoadingProjects(false);
    }
  }

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedProjectId = Number(projectId);
    if (!Number.isFinite(parsedProjectId)) {
      setError("Select a project before searching.");
      return;
    }

    const parsedTopK = Number(topK);
    const parsedSnippetLength = Number(maxSnippetLength);

    setSearching(true);
    setError(null);
    setSearchParams(projectId ? { projectId } : {});
    try {
      const data = await searchArtifacts({
        projectId: parsedProjectId,
        query,
        status,
        type: type.trim() || undefined,
        mode: mode || undefined,
        topK: Number.isFinite(parsedTopK) && parsedTopK > 0 ? Math.min(parsedTopK, 20) : undefined,
        maxSnippetLength:
          Number.isFinite(parsedSnippetLength) && parsedSnippetLength > 0 ? parsedSnippetLength : undefined,
      });
      setResults(data);
    } catch (err) {
      setError(toUiErrorMessage(err));
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function onCreateArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedProjectId = Number(newArtifactProjectId);
    if (!Number.isFinite(parsedProjectId)) {
      setCreateError("Project is required.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const created = await createArtifact({
        projectId: parsedProjectId,
        type: newArtifactType.trim(),
        title: newArtifactTitle.trim(),
        content: newArtifactContent.trim(),
      });
      setCreateSuccess(`Artifact #${created.id} created as DRAFT.`);
      setNewArtifactType("");
      setNewArtifactTitle("");
      setNewArtifactContent("");
    } catch (err) {
      setCreateError(toUiErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Artifacts</h2>
        <p>Search and create artifacts across projects.</p>
      </div>

      {loadingProjects && <p className="info">Loading projects...</p>}

      <form className="card stacked" onSubmit={onSearch}>
        <h3>Search filters</h3>
        <div className="form-grid split">
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
            Query (required parameter)
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Text query (can be empty, still sent explicitly)"
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ArtifactStatus)}
            >
              {artifactStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Type
            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Optional type filter"
            />
          </label>

          <label>
            Mode
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as ArtifactSearchMode | "")}
            >
              <option value="">Auto</option>
              {searchModes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            topK (max 20)
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(event) => setTopK(event.target.value)}
            />
          </label>

          <label>
            Max snippet length
            <input
              type="number"
              min={1}
              value={maxSnippetLength}
              onChange={(event) => setMaxSnippetLength(event.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={searching || loadingProjects}>
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="alert error">{error}</p>}

      {!searching && !error && results.length === 0 && (
        <p className="info">No search results yet. Run a search to see artifacts.</p>
      )}

      {results.length > 0 && (
        <div className="results-list">
          {results.map((item) => (
            <article className="card result-card" key={`${item.id}-${item.sectionId ?? "na"}`}>
              <div className="result-head">
                <h3>{item.title}</h3>
                <StatusBadge status={item.status} />
              </div>
              <p className="snippet">{item.snippet}</p>
              <div className="meta-grid">
                <span>Artifact #{item.id}</span>
                <span>Match: {item.matchType}</span>
                <span>Score: {item.score === null ? "-" : item.score.toFixed(4)}</span>
                <span>Section: {item.sectionId ?? "-"}</span>
                <span>Snippet len: {item.snippetLength}</span>
                <span>{item.snippetTruncated ? "Snippet was truncated" : "Full snippet shown"}</span>
              </div>
              <div className="result-actions">
                <Link to={`/artifacts/${item.id}`}>Open</Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <form className="card stacked" onSubmit={onCreateArtifact}>
        <h3>Create DRAFT artifact</h3>
        <div className="form-grid split">
          <label>
            Project
            <select
              value={newArtifactProjectId}
              onChange={(event) => setNewArtifactProjectId(event.target.value)}
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} (#{project.id})
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <input
              value={newArtifactType}
              onChange={(event) => setNewArtifactType(event.target.value)}
              required
            />
          </label>
          <label>
            Title
            <input
              value={newArtifactTitle}
              onChange={(event) => setNewArtifactTitle(event.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Content
          <textarea
            value={newArtifactContent}
            onChange={(event) => setNewArtifactContent(event.target.value)}
            rows={6}
            required
          />
        </label>
        {selectedProject && <p className="info">Selected search project: {selectedProject.name}</p>}
        {createError && <p className="alert error">{createError}</p>}
        {createSuccess && <p className="alert success">{createSuccess}</p>}
        <button type="submit" disabled={createLoading || loadingProjects}>
          {createLoading ? "Creating..." : "Create artifact"}
        </button>
      </form>
    </section>
  );
}
