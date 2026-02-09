import type { ArtifactStatus } from "../types";

interface Props {
  status: ArtifactStatus;
}

export function StatusBadge({ status }: Props) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}
