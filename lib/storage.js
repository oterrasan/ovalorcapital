import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH || 'main';
const token = process.env.GITHUB_TOKEN;

function resolveLocal(filePath) { return path.join(rootDir, filePath); }
async function readLocalJson(filePath, fallback = null) { try { const raw = await fs.readFile(resolveLocal(filePath), 'utf-8'); return JSON.parse(raw); } catch { return fallback; } }
async function writeLocalJson(filePath, content) { const fullPath = resolveLocal(filePath); await fs.mkdir(path.dirname(fullPath), { recursive: true }); await fs.writeFile(fullPath, JSON.stringify(content, null, 2), 'utf-8'); return true; }
async function githubRequest(urlPath, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${urlPath}`, { ...options, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) { const text = await response.text(); throw new Error(`GitHub ${response.status}: ${text}`); }
  return response.json();
}
async function writeGithubJson(filePath, content, message = 'Update content') {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  let sha; try { const existing = await githubRequest(`contents/${encodedPath}?ref=${branch}`); sha = existing.sha; } catch {}
  const body = { message, content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'), branch, ...(sha ? { sha } : {}) };
  await githubRequest(`contents/${encodedPath}`, { method: 'PUT', body: JSON.stringify(body) });
  return true;
}
export async function readJson(filePath, fallback = null) { return readLocalJson(filePath, fallback); }
export async function writeJson(filePath, content, message = 'Update content') { if (token && repo) return writeGithubJson(filePath, content, message); return writeLocalJson(filePath, content); }
