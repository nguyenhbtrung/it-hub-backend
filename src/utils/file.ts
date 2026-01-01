export function toAbsoluteURL(relativePath: string) {
  const ASSET_BASE_URL = process.env.ASSET_BASE_URL || 'http://localhost:8080';
  return new URL(relativePath, ASSET_BASE_URL).toString();
}
