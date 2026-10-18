/**
 * ESLint and Oxlint report paths in the native spelling, so a Windows run says `src\app.js`.
 * Assertions compare one spelling on every platform, which is what a consumer sees in a report.
 */
export function toPosixPath(path: string): string {
  return path.replaceAll('\\', '/')
}
