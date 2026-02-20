/**
 * Parse DATABASE_URL for safe logging. Never log or return the password.
 */
export function parseDatabaseUrlForLogging(url: string | undefined): {
  dbHost: string;
  databaseName: string;
  masked: string;
} {
  if (!url || typeof url !== 'string') {
    return { dbHost: '(not set)', databaseName: '(not set)', masked: '(DATABASE_URL not set)' };
  }
  try {
    const u = new URL(url);
    const dbHost = u.hostname;
    // Pathname is e.g. "/postgres" -> database name "postgres"
    const databaseName = u.pathname ? u.pathname.replace(/^\//, '').split('/')[0] || 'postgres' : 'postgres';
    // Mask: protocol + host + port + path only, no user:password
    const masked = `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}****`;
    return { dbHost, databaseName, masked };
  } catch {
    return { dbHost: '(invalid)', databaseName: '(invalid)', masked: '(invalid URL)' };
  }
}
