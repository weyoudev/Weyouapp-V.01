/**
 * Standalone health check for Vercel API-only project.
 * Served at /api/health by file-based routing (no rewrites needed).
 * Use this to verify the deployment and that you're hitting the API project.
 */
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({ status: 'ok', source: 'api/health.js' }));
};
module.exports.get = module.exports;
