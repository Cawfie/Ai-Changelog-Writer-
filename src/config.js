import fs from 'fs';
import path from 'path';

export function loadConfig() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const equalIdx = trimmed.indexOf('=');
        if (equalIdx !== -1) {
          const key = trimmed.slice(0, equalIdx).trim();
          let value = trimmed.slice(equalIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (process.env[key] === undefined) {
             process.env[key] = value;
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }
  
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!anthropicKey && !geminiKey) {
     console.error("API key missing. Please set ANTHROPIC_API_KEY or GEMINI_API_KEY in your .env file or environment.");
     process.exit(1);
  }
  
  return { anthropicKey, geminiKey, githubToken };
}
