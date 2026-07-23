export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function describeTimelineChange(entry: { fromStage?: string; toStage?: string; note?: string }): string {
  const parts: string[] = [];
  if (entry.fromStage && entry.toStage) {
    parts.push(`${entry.fromStage} → ${entry.toStage}`);
  } else if (entry.toStage) {
    parts.push(entry.toStage);
  }
  if (entry.note) {
    parts.push(`（${entry.note}）`);
  }
  return parts.join(' ');
}
