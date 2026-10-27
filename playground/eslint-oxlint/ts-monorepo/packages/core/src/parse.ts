/** One key/value pair of an untrusted payload, kept only when the value is a string. */
export function parseRecord(payload: unknown): Record<string, string> {
  if (typeof payload !== 'object' || payload === null) {
    throw new TypeError('Expected an object payload')
  }

  const record: Record<string, string> = {}
  // The boundary: an untrusted payload arrives as `any`, and this is the one place the example
  // accepts that, which is why `ts/no-unsafe-assignment` is off for this package alone.
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      record[key] = value
    }
  }
  return record
}
