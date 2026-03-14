const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'oterrasan';
const REPO_NAME = 'ovalorcapital';
const BRANCH = 'main';

async function githubRequest(path, method = 'GET', body = null) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok && response.status !== 404) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  return response;
}

export async function getFileFromGithub(path) {
  try {
    const response = await githubRequest(`contents/${path}?ref=${BRANCH}`);
    if (response.status === 404) return null;
    
    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content: JSON.parse(content), sha: data.sha };
  } catch (error) {
    console.error('[GITHUB] Error getting file:', error);
    return null;
  }
}

export async function saveFileToGithub(path, content, message = 'Update file') {
  try {
    const existing = await githubRequest(`contents/${path}`).then(r => r.status === 404 ? null : r.json()).catch(() => null);
    
    const body = {
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch: BRANCH
    };
    
    if (existing?.sha) {
      body.sha = existing.sha;
    }
    
    await githubRequest(`contents/${path}`, 'PUT', body);
    return true;
  } catch (error) {
    console.error('[GITHUB] Error saving file:', error);
    return false;
  }
}

export async function uploadImageToGithub(path, base64Data, message = 'Upload image') {
  try {
    const existing = await githubRequest(`contents/${path}`).then(r => r.status === 404 ? null : r.json()).catch(() => null);
    
    const body = {
      message,
      content: base64Data,
      branch: BRANCH
    };
    
    if (existing?.sha) {
      body.sha = existing.sha;
    }
    
    await githubRequest(`contents/${path}`, 'PUT', body);
    return true;
  } catch (error) {
    console.error('[GITHUB] Error uploading image:', error);
    return false;
  }
}
