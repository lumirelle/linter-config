/** Renders a parsed record as one `key=value` line, for the CLI's output. */
export function formatRecord(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
}
