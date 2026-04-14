import fs from 'fs';
import path from 'path';

export function appendToChangelog(repoPath, filename, newEntry, version) {
  const filePath = path.join(repoPath, filename);
  let content = '';

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  } else {
    content = '# Changelog\n\nAll notable changes to this project will be documented here.\n\n';
  }

  if (versionExists(repoPath, filename, version)) {
    const startIdx = content.indexOf(`## ${version}`);
    const remaining = content.slice(startIdx + `## ${version}`.length);
    const nextMatch = remaining.match(/\n## /);
    
    let endIdx = -1;
    if (nextMatch) {
      endIdx = startIdx + `## ${version}`.length + nextMatch.index;
    }
    
    if (endIdx !== -1) {
       content = content.slice(0, startIdx) + newEntry + '\n\n' + content.slice(endIdx);
    } else {
       content = content.slice(0, startIdx) + newEntry + '\n';
    }
  } else {
    const firstVersionMatch = content.match(/\n## /);
    if (firstVersionMatch) {
       const insertIdx = firstVersionMatch.index + 1;
       content = content.slice(0, insertIdx) + newEntry + '\n\n' + content.slice(insertIdx);
    } else {
       content += newEntry + '\n';
    }
  }

  fs.writeFileSync(filePath, content);
  return filePath;
}

export function versionExists(repoPath, filename, version) {
  const filePath = path.join(repoPath, filename);
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(`## ${version}`);
}
