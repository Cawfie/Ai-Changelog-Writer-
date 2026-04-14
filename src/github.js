import { Octokit } from '@octokit/rest';
import { getRepoRemote } from './git.js';

function isPrerelease(tag) {
  const lower = tag.toLowerCase();
  return lower.includes('alpha') || lower.includes('beta') || lower.includes('rc') || lower.includes('pre');
}

export async function pushToGitHubRelease({ repoPath, tag, body, draft, token }) {
  const remote = getRepoRemote(repoPath);
  if (!remote) {
    throw new Error('Can not detect remote repo from git config. Missing origin url targeting github.');
  }

  const octokit = new Octokit({ auth: token });
  
  try {
    const release = await octokit.repos.createRelease({
      owner: remote.owner,
      repo: remote.repo,
      tag_name: tag,
      name: tag,
      body,
      draft: !!draft,
      prerelease: isPrerelease(tag)
    });
    return release.data;
  } catch (err) {
    if (err.status === 401) {
      throw new Error('GitHub token is invalid or expired');
    } else if (err.status === 422) {
      throw new Error(`Release for tag ${tag} already exists on GitHub`);
    } else {
      throw err;
    }
  }
}
