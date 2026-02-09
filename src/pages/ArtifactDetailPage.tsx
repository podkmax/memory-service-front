import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiClientError, toUiErrorMessage } from "../api/client";
import {
  approveArtifact,
  deprecateArtifact,
  getArtifact,
  patchArtifact,
} from "../api/memoryService";
import { StatusBadge } from "../components/StatusBadge";
import type { ArtifactResponse } from "../types";

const presets = [4000, 10000, 50000] as const;

export function ArtifactDetailPage() {
  const params = useParams();
  const [artifact, setArtifact] = useState<ArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [maxContentLength, setMaxContentLength] = useState("4000");
  const [customLength, setCustomLength] = useState("");
  const [editType, setEditType] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const isDraft = artifact?.status === "DRAFT";

  const parsedArtifactId = useMemo(() => Number(params.id), [params.id]);

  useEffect(() => {
    if (!Number.isFinite(parsedArtifactId)) {
      setError("Invalid artifact id.");
      setLoading(false);
      return;
    }
    void loadArtifact(parsedArtifactId, Number(maxContentLength));
  }, [parsedArtifactId]);

  async function loadArtifact(id: number, length?: number) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await getArtifact(id, length);
      setArtifact(data);
      setEditType(data.type);
      setEditTitle(data.title);
      setEditContent(data.content);
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onLoadMore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!artifact) {
      return;
    }
    const parsed = Number(maxContentLength);
    await loadArtifact(artifact.id, Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
  }

  function onSelectPreset(value: string) {
    if (value === "custom") {
      setMaxContentLength(customLength || "4000");
      return;
    }
    setMaxContentLength(value);
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!artifact || !isDraft) {
      return;
    }

    const payload: { type?: string; title?: string; content?: string } = {};
    const typeValue = editType.trim();
    const titleValue = editTitle.trim();
    const contentValue = editContent.trim();
    if (typeValue !== artifact.type) {
      payload.type = typeValue;
    }
    if (titleValue !== artifact.title) {
      payload.title = titleValue;
    }
    if (contentValue !== artifact.content) {
      payload.content = contentValue;
    }

    if (!payload.type && !payload.title && !payload.content) {
      setSuccess("No changes to save.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await patchArtifact(artifact.id, payload, Number(maxContentLength));
      setArtifact(updated);
      setEditType(updated.type);
      setEditTitle(updated.title);
      setEditContent(updated.content);
      setSuccess("Artifact updated.");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setError("Update conflict: only DRAFT artifacts can be edited. Reload artifact state.");
      } else {
        setError(toUiErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  async function onChangeStatus(target: "approve" | "deprecate") {
    if (!artifact) {
      return;
    }

    setChangingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      if (target === "approve") {
        await approveArtifact(artifact.id, Number(maxContentLength));
      } else {
        await deprecateArtifact(artifact.id, Number(maxContentLength));
      }
      await loadArtifact(artifact.id, Number(maxContentLength));
      setSuccess(target === "approve" ? "Artifact approved." : "Artifact deprecated.");
    } catch (err) {
      setError(toUiErrorMessage(err));
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Artifact details</h2>
        <p>Inspect content and update DRAFT artifacts.</p>
      </div>

      {loading && <p className="info">Loading artifact...</p>}
      {error && <p className="alert error">{error}</p>}
      {success && <p className="alert success">{success}</p>}

      {!loading && artifact && (
        <>
          <article className="card stacked">
            <div className="row between">
              <h3>{artifact.title}</h3>
              <StatusBadge status={artifact.status} />
            </div>
            <div className="meta-grid">
              <span>ID: {artifact.id}</span>
              <span>Project: {artifact.projectId}</span>
              <span>Type: {artifact.type}</span>
              <span>Version: {artifact.version}</span>
              <span>Updated at: {new Date(artifact.updatedAt).toLocaleString()}</span>
              <span>
                Content: {artifact.contentLength} chars
                {artifact.contentTruncated ? " (truncated)" : ""}
              </span>
            </div>

            <form className="inline-form" onSubmit={onLoadMore}>
              <label>
                maxContentLength
                <select
                  value={presets.includes(Number(maxContentLength) as (typeof presets)[number]) ? maxContentLength : "custom"}
                  onChange={(event) => onSelectPreset(event.target.value)}
                >
                  {presets.map((value) => (
                    <option key={value} value={String(value)}>
                      {value}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              <input
                type="number"
                min={1}
                placeholder="Custom"
                value={customLength}
                onChange={(event) => {
                  setCustomLength(event.target.value);
                  if (event.target.value) {
                    setMaxContentLength(event.target.value);
                  }
                }}
              />
              <button type="submit">Load</button>
            </form>

            <pre className="content-view">{artifact.content}</pre>
          </article>

          <form className="card stacked" onSubmit={onSave}>
            <h3>Edit artifact</h3>
            {!isDraft && (
              <p className="info">Editing is disabled because this artifact is not in DRAFT status.</p>
            )}

            <div className="form-grid split">
              <label>
                Type
                <input
                  value={editType}
                  onChange={(event) => setEditType(event.target.value)}
                  disabled={!isDraft}
                />
              </label>
              <label>
                Title
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  disabled={!isDraft}
                />
              </label>
            </div>

            <label>
              Content
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={10}
                disabled={!isDraft}
              />
            </label>

            <button type="submit" disabled={!isDraft || saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>

          <div className="card row">
            <button
              type="button"
              onClick={() => void onChangeStatus("approve")}
              disabled={changingStatus}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => void onChangeStatus("deprecate")}
              disabled={changingStatus}
            >
              Deprecate
            </button>
          </div>
        </>
      )}
    </section>
  );
}
