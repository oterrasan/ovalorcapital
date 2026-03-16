
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const useGithub = !!(GITHUB_OWNER && GITHUB_REPO && GITHUB_TOKEN);

async function ensureLocalDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readLocal(name, fallback = null) {
  await ensureLocalDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeLocal(name, value) {
  await ensureLocalDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
  return { ok: true, mode: 'local', file };
}

async function githubRequest(filePath, options = {}) {
  const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    'User-Agent': 'ovc-v3'
  };
  return fetch(`${base}${options.query ? `?${options.query}` : ''}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
}

async function readGithub(name, fallback = null) {
  const filePath = `data/${name}.json`;
  const response = await githubRequest(filePath, { query: `ref=${encodeURIComponent(GITHUB_BRANCH)}` });
  if (!response.ok) return fallback;
  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return JSON.parse(content);
}

async function writeGithub(name, value) {
  const filePath = `data/${name}.json`;
  const existingResponse = await githubRequest(filePath, { query: `ref=${encodeURIComponent(GITHUB_BRANCH)}` });
  let sha = undefined;
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    sha = existing.sha;
  }
  const body = {
    message: `OVC admin update: ${name}`,
    content: Buffer.from(JSON.stringify(value, null, 2), 'utf8').toString('base64'),
    branch: GITHUB_BRANCH,
    sha
  };
  const saveResponse = await githubRequest(filePath, { method: 'PUT', body });
  if (!saveResponse.ok) {
    const errorText = await saveResponse.text();
    throw new Error(`GitHub save failed for ${name}: ${errorText}`);
  }
  return { ok: true, mode: 'github', file: filePath };
}

export async function loadResource(name, fallback = null) {
  if (useGithub) {
    const remote = await readGithub(name, null);
    if (remote !== null) return remote;
  }
  return readLocal(name, fallback);
}

export async function saveResource(name, value) {
  if (useGithub) return writeGithub(name, value);
  return writeLocal(name, value);
}

export async function loadMany(names) {
  const entries = await Promise.all(names.map(async name => [name, await loadResource(name, null)]));
  return Object.fromEntries(entries);
}

export function storageMode() {
  return useGithub ? 'github' : 'local';
}
