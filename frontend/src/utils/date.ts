export function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
