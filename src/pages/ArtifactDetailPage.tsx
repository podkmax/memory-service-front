import { FormEvent, useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
const hugeMaxContentLength = 200000;
type ContentMode = "markdown" | "raw";

export function ArtifactDetailPage() {
  const params = useParams();
  const [artifact, setArtifact] = useState<ArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoLoadingFullContent, setAutoLoadingFullContent] = useState(false);
  const [stillTruncatedAfterAutoLoad, setStillTruncatedAfterAutoLoad] = useState(false);
  const [contentMode, setContentMode] = useState<ContentMode>("markdown");

  const [maxContentLength, setMaxContentLength] = useState("4000");
  const [customLength, setCustomLength] = useState("");
  const [editType, setEditType] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const isDraft = artifact?.status === "DRAFT";
  const canEdit = isDraft && contentMode === "raw";

  const parsedArtifactId = useMemo(() => Number(params.id), [params.id]);

  useEffect(() => {
    if (!Number.isFinite(parsedArtifactId)) {
      setError("Invalid artifact id.");
      setLoading(false);
      return;
    }
    void loadArtifact(parsedArtifactId, Number(maxContentLength), false);
  }, [parsedArtifactId]);

  async function loadArtifact(id: number, length?: number, skipAutoLoad = false) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setStillTruncatedAfterAutoLoad(false);
    try {
      const data = await getArtifact(id, length);
      let effective = data;

      if (!skipAutoLoad && data.contentTruncated) {
        setAutoLoadingFullContent(true);
        try {
          const full = await getArtifact(id, hugeMaxContentLength);
          effective = full;
          if (full.contentTruncated) {
            setStillTruncatedAfterAutoLoad(true);
          }
        } finally {
          setAutoLoadingFullContent(false);
        }
      }

      setArtifact(effective);
      setEditType(effective.type);
      setEditTitle(effective.title);
      setEditContent(effective.content);
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
    await loadArtifact(
      artifact.id,
      Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
      true,
    );
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
    if (!artifact || !canEdit) {
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
      let effective = updated;
      if (updated.contentTruncated) {
        setAutoLoadingFullContent(true);
        try {
          const full = await getArtifact(updated.id, hugeMaxContentLength);
          effective = full;
          if (full.contentTruncated) {
            setStillTruncatedAfterAutoLoad(true);
          }
        } finally {
          setAutoLoadingFullContent(false);
        }
      }
      setArtifact(effective);
      setEditType(effective.type);
      setEditTitle(effective.title);
      setEditContent(effective.content);
      setSuccess("Artifact updated.");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setError("Редактирование доступно только для DRAFT");
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
      await loadArtifact(artifact.id, Number(maxContentLength), false);
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

            {autoLoadingFullContent && (
              <p className="info">Loading full content automatically...</p>
            )}
            {stillTruncatedAfterAutoLoad && (
              <p className="alert error">
                Content is still truncated after automatic full-load attempt. Use Advanced settings to request larger content.
              </p>
            )}

            <div className="content-mode-switch" role="tablist" aria-label="Content mode">
              <button
                type="button"
                role="tab"
                aria-selected={contentMode === "markdown"}
                className={contentMode === "markdown" ? "mode-tab active" : "mode-tab"}
                onClick={() => setContentMode("markdown")}
              >
                Markdown
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={contentMode === "raw"}
                className={contentMode === "raw" ? "mode-tab active" : "mode-tab"}
                onClick={() => setContentMode("raw")}
              >
                Raw
              </button>
            </div>

            {contentMode === "markdown" ? (
              <div className="markdown-view">
                <Markdown remarkPlugins={[remarkGfm]} skipHtml>
                  {artifact.content}
                </Markdown>
              </div>
            ) : (
              <pre className="content-view">{artifact.content}</pre>
            )}

            <details className="advanced-panel">
              <summary>Advanced maxContentLength</summary>
              <form className="inline-form" onSubmit={onLoadMore}>
                <label>
                  maxContentLength
                  <select
                    value={
                      presets.includes(Number(maxContentLength) as (typeof presets)[number])
                        ? maxContentLength
                        : "custom"
                    }
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
            </details>
          </article>

          <form className="card stacked" onSubmit={onSave}>
            <h3>Edit artifact</h3>
            {!isDraft && <p className="info">Editing is disabled because this artifact is not in DRAFT status.</p>}
            {isDraft && contentMode !== "raw" && (
              <p className="info">Switch to Raw mode to edit artifact content.</p>
            )}

            <div className="form-grid split">
              <label>
                Type
                <input
                  value={editType}
                  onChange={(event) => setEditType(event.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label>
                Title
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  disabled={!canEdit}
                />
              </label>
            </div>

            <label>
              Content
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={10}
                disabled={!canEdit}
              />
            </label>

            <button type="submit" disabled={!canEdit || saving}>
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
