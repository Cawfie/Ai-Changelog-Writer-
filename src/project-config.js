import fs from 'fs';
import path from 'path';

const DEFAULTS = {
  model: 'claude-sonnet-4-20250514',
  changelogFile: 'CHANGELOG.md',
  excludeTypes: ['chore', 'ci', 'test', 'style'],
  includeInternal: false,
  format: 'markdown',
  github: {
    draft: false,
    prerelease: false,
  },
};

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

export function loadProjectConfig(repoPath) {
  const defaultClone = JSON.parse(JSON.stringify(DEFAULTS));
  const configPath = path.join(repoPath, 'changelog.config.json');
  try {
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return deepMerge(defaultClone, fileConfig);
    }
  } catch (err) {
     // Silently fall back to defaults
  }
  return defaultClone;
}
