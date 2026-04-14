import { getCommits, getDiff, getTagDate } from './git.js';

function formatList(commits) {
  return commits.map(c => {
    let pr = c.prNumber ? ` (#${c.prNumber})` : '';
    let line = `- [${c.hash}] ${c.subject}${pr}`;
    if (c.body) {
      let context = c.body.trim().slice(0, 200).replace(/\n/g, ' ');
      line += `\n  Context: ${context}`;
    }
    return line;
  }).join('\n');
}

export async function generateChangelog({ from, to, repoPath, model, apiKey, excludeTypes, format }) {
  const commits = getCommits(repoPath, from, to);
  if (commits.length === 0) {
    throw new Error(`No commits found between ${from} and ${to}. Check that both tags exist.`);
  }

  const diff = getDiff(repoPath, from, to);
  const toDate = getTagDate(repoPath, to);
  
  const excludeTypesSet = new Set(excludeTypes || []);
  const filteredCommits = commits.filter(c => c.isBreaking || !excludeTypesSet.has(c.type));

  const groups = {
    breaking: filteredCommits.filter(c => c.isBreaking),
    features: filteredCommits.filter(c => c.type === 'feat' && !c.isBreaking),
    fixes:    filteredCommits.filter(c => c.type === 'fix' && !c.isBreaking),
    perf:     filteredCommits.filter(c => c.type === 'perf' && !c.isBreaking),
    docs:     filteredCommits.filter(c => c.type === 'docs' && !c.isBreaking),
    other:    filteredCommits.filter(c => 
      !['feat','fix','perf','docs'].includes(c.type) && !c.isBreaking
    ),
  };

  if (format === 'json') {
    return JSON.stringify({
      version: to,
      previousVersion: from,
      date: toDate,
      totalCommits: filteredCommits.length,
      breaking: groups.breaking.map(c => ({ hash: c.hash, subject: c.subject, pr: c.prNumber })),
      features: groups.features.map(c => ({ hash: c.hash, subject: c.subject, pr: c.prNumber })),
      fixes: groups.fixes.map(c => ({ hash: c.hash, subject: c.subject, pr: c.prNumber })),
      perf: groups.perf.map(c => ({ hash: c.hash, subject: c.subject, pr: c.prNumber })),
      docs: groups.docs.map(c => ({ hash: c.hash, subject: c.subject, pr: c.prNumber })),
      other: groups.other.map(c => ({ hash: c.hash, subject: c.subject, pr: c.prNumber })),
    }, null, 2);
  }

  const uniqueAuthors = [...new Set(filteredCommits.map(c => c.author))];

  const prompt = `You are a technical writer generating a professional, human-readable changelog.

I will give you raw git commits grouped by category. Rewrite them into polished markdown release notes that developers and users will actually enjoy reading.

## Release Info
- Version: ${to}
- Previous version: ${from}
- Release date: ${toDate}
- Total commits: ${filteredCommits.length}
- Contributors: ${uniqueAuthors.join(', ')}

## Raw Commits

${groups.breaking.length > 0 ? `BREAKING CHANGES (${groups.breaking.length}):\n${formatList(groups.breaking)}` : ''}
${groups.features.length > 0 ? `NEW FEATURES (${groups.features.length}):\n${formatList(groups.features)}` : ''}
${groups.fixes.length > 0 ? `BUG FIXES (${groups.fixes.length}):\n${formatList(groups.fixes)}` : ''}
${groups.perf.length > 0 ? `PERFORMANCE (${groups.perf.length}):\n${formatList(groups.perf)}` : ''}
${groups.docs.length > 0 ? `DOCUMENTATION (${groups.docs.length}):\n${formatList(groups.docs)}` : ''}
${groups.other.length > 0 ? `OTHER (${groups.other.length}):\n${formatList(groups.other)}` : ''}

${diff ? `## Files Changed\n${diff.slice(0, 1500)}` : ''}

## Instructions

1. Start with: ## ${to} — ${toDate}

2. Use these sections (only include sections with entries):
   - ### ⚠️ Breaking Changes
   - ### ✨ New Features
   - ### 🐛 Bug Fixes
   - ### ⚡ Performance
   - ### 📝 Documentation
   - ### 🔧 Internal

3. Rules:
   - NEVER copy-paste commit messages. Rewrite each as a clear English sentence.
   - Write from the USER's perspective ("You can now..." / "Fixed an issue where...")
   - Group related commits into ONE entry when they're part of the same thing
   - For breaking changes, always include a "**Migration:**" line explaining what to change
   - Include PR numbers where available: (#42)
   - Keep entries to 1-2 lines max
   - For the Internal section: keep it brief, or skip it entirely if trivial

4. End with:
   **Full diff:** \`${from}...${to}\`

Output ONLY the markdown. No preamble. No explanation. Start directly with ## ${to}`;

  let changelog = '';
  
  if (model.includes('gemini')) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096 },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
       throw new Error(`API error ${response.status}: ${JSON.stringify(data)}`);
    }
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
       throw new Error(`API error: Unexpected response from Gemini: ${JSON.stringify(data)}`);
    }
    changelog = data.candidates[0].content.parts[0].text.trim();
  } else {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
       throw new Error(`API error ${response.status}: ${data.error?.message || JSON.stringify(data)}`);
    }
    changelog = data.content[0].text.trim();
  }

  return changelog;
}
