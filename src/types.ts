export type ArtifactStatus = "DRAFT" | "APPROVED" | "DEPRECATED";
export type ArtifactSearchMode = "LIKE" | "VECTOR" | "HYBRID";
export type ArtifactMatchType = "LIKE" | "VECTOR";

export interface ApiErrorPayload {
  message?: string;
  status?: number;
  timestamp?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
}

export interface ArtifactResponse {
  id: number;
  projectId: number;
  type: string;
  title: string;
  content: string;
  status: ArtifactStatus;
  version: number;
  updatedAt: string;
  contentTruncated: boolean;
  contentLength: number;
}

export interface ArtifactSearchItem {
  id: number;
  title: string;
  snippet: string;
  status: ArtifactStatus;
  snippetTruncated: boolean;
  snippetLength: number;
  matchType: ArtifactMatchType;
  score: number | null;
  sectionId: number | null;
}

export interface ReindexResponse {
  projectId: number;
  status: string;
  type: string | null;
  processed: number;
  failed: number;
}

export interface SearchArtifactsParams {
  projectId: number;
  query: string;
  status?: ArtifactStatus;
  type?: string;
  mode?: ArtifactSearchMode;
  topK?: number;
  maxSnippetLength?: number;
}

export interface CreateArtifactPayload {
  projectId: number;
  type: string;
  title: string;
  content: string;
}

export interface UpdateArtifactPayload {
  type?: string;
  title?: string;
  content?: string;
}
