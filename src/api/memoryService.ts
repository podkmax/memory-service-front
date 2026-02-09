import { apiClient } from "./client";
import type {
  ArtifactResponse,
  ArtifactStatus,
  CreateArtifactPayload,
  ProjectResponse,
  ReindexResponse,
  SearchArtifactsParams,
  UpdateArtifactPayload,
  ArtifactSearchItem,
} from "../types";

export function listProjects(name?: string): Promise<ProjectResponse[]> {
  return apiClient.get<ProjectResponse[]>("/api/projects", { name });
}

export function createProject(name: string): Promise<ProjectResponse> {
  return apiClient.post<ProjectResponse>("/api/projects", { name });
}

export function getProject(id: number): Promise<ProjectResponse> {
  return apiClient.get<ProjectResponse>(`/api/projects/${id}`);
}

export function searchArtifacts(params: SearchArtifactsParams): Promise<ArtifactSearchItem[]> {
  return apiClient.get<ArtifactSearchItem[]>("/api/artifacts/search", {
    projectId: params.projectId,
    query: params.query,
    status: params.status,
    type: params.type,
    mode: params.mode,
    topK: params.topK,
    maxSnippetLength: params.maxSnippetLength,
  });
}

export function createArtifact(
  payload: CreateArtifactPayload,
  maxContentLength?: number,
): Promise<ArtifactResponse> {
  return apiClient.post<ArtifactResponse>("/api/artifacts", payload, {
    maxContentLength,
  });
}

export function getArtifact(id: number, maxContentLength?: number): Promise<ArtifactResponse> {
  return apiClient.get<ArtifactResponse>(`/api/artifacts/${id}`, { maxContentLength });
}

export function patchArtifact(
  id: number,
  payload: UpdateArtifactPayload,
  maxContentLength?: number,
): Promise<ArtifactResponse> {
  return apiClient.patch<ArtifactResponse>(`/api/artifacts/${id}`, payload, {
    maxContentLength,
  });
}

export function approveArtifact(id: number, maxContentLength?: number): Promise<ArtifactResponse> {
  return apiClient.post<ArtifactResponse>(`/api/artifacts/${id}/approve`, undefined, {
    maxContentLength,
  });
}

export function deprecateArtifact(
  id: number,
  maxContentLength?: number,
): Promise<ArtifactResponse> {
  return apiClient.post<ArtifactResponse>(`/api/artifacts/${id}/deprecate`, undefined, {
    maxContentLength,
  });
}

export function reindexProject(
  projectId: number,
  params: { status?: ArtifactStatus; type?: string; limit?: number },
): Promise<ReindexResponse> {
  return apiClient.post<ReindexResponse>(`/api/admin/projects/${projectId}/reindex`, undefined, {
    status: params.status,
    type: params.type,
    limit: params.limit,
  });
}
