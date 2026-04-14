import { execSync } from 'child_process';

export function getCommits(repoPath, from, to) {
  try {
    const cmd = `git -C "${repoPath}" log ${from}..${to} --pretty=format:"%H|||%an|||%ae|||%ad|||%s|||%b---COMMIT_END---" --date=short`;
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    
    if (!stdout.trim()) return [];
    
    const commitBlocks = stdout.split('---COMMIT_END---').map(s => s.trim()).filter(Boolean);
    
    return commitBlocks.map(block => {
      const parts = block.split('|||');
      const hash = parts[0] || '';
      const author = parts[1] || '';
      const email = parts[2] || '';
      const date = parts[3] || '';
      const subject = parts[4] || '';
      const body = parts[5] || '';
      
      const isBreaking = subject.includes('!:') || body.toUpperCase().includes('BREAKING CHANGE');
      
      let prNumber = null;
      const prMatch = subject.match(/\(#(\d+)\)/);
      if (prMatch) {
         prNumber = prMatch[1];
      }
      
      let type = 'other';
      if (/^(feat|feature)(\(.+\))?[!:]/.test(subject)) {
         type = 'feat';
      } else if (/^(fix)(\(.+\))?[!:]/.test(subject)) {
         type = 'fix';
      } else if (/^(docs|doc)(\(.+\))?[!:]/.test(subject)) {
         type = 'docs';
      } else if (/^(perf)(\(.+\))?[!:]/.test(subject)) {
         type = 'perf';
      } else if (/^(chore)(\(.+\))?[!:]/.test(subject)) {
         type = 'chore';
      } else if (/^(refactor)(\(.+\))?[!:]/.test(subject)) {
         type = 'refactor';
      } else if (/^(test)(\(.+\))?[!:]/.test(subject)) {
         type = 'test';
      } else if (/^(ci|build)(\(.+\))?[!:]/.test(subject)) {
         type = 'ci';
      } else if (/^(style)(\(.+\))?[!:]/.test(subject)) {
         type = 'style';
      } else if (/^(revert)(\(.+\))?[!:]/.test(subject)) {
         type = 'revert';
      } else if (/^(other)(\(.+\))?[!:]/.test(subject)) {
         type = 'other';
      }
      
      return {
         hash: hash.slice(0, 7),
         fullHash: hash,
         author,
         email,
         date,
         subject,
         body,
         type,
         isBreaking,
         prNumber
      };
    });
  } catch (err) {
    throw new Error("Git error: " + err.message);
  }
}

export function getDiff(repoPath, from, to) {
  try {
    const cmd = `git -C "${repoPath}" diff --stat ${from}..${to}`;
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (err) {
    return '';
  }
}

export function getTagDate(repoPath, tag) {
  try {
    const cmd = `git -C "${repoPath}" log -1 --format="%ad" --date=short ${tag}`;
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    return new Date().toISOString().split('T')[0];
  }
}

export function listTags(repoPath, count) {
  try {
    const cmd = `git -C "${repoPath}" tag --sort=-version:refname`;
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    return stdout.split('\n').map(s => s.trim()).filter(Boolean).slice(0, count);
  } catch (err) {
    throw new Error("Git error: " + err.message);
  }
}

export function getRepoRemote(repoPath) {
  try {
    const cmd = `git -C "${repoPath}" remote get-url origin`;
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const match = stdout.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      let repo = match[2];
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4);
      }
      return { owner: match[1], repo };
    }
    return null;
  } catch (err) {
    return null;
  }
}
