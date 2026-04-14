# 📜 cdlog — AI-Powered Changelog Genius

`cdlog` is a powerful CLI tool that transforms your messy git commits into professional, human-readable release notes using **Gemini** or **Claude**.

![Premium Design Mockup](https://img.shields.io/badge/AI-Advanced-blueviolet?style=for-the-badge)
![Fast](https://img.shields.io/badge/Speed-Lightning-yellow?style=for-the-badge)

## ✨ Features
- 🤖 **AI Summarization**: Rewrites technical commits into user-facing value.
- 📦 **Smart Categorization**: Automatically groups Features, Fixes, and Breaking Changes.
- ⚠️ **Breaking Change Detection**: Identifies `!` commits and generates migration paths.
- 🔗 **GitHub Integration**: Creates official GitHub Releases with one command.
- 🛠️ **Fully Configurable**: Ignore chore/test commits and customize the output.

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/Cawfie/cdlog.git
cd cdlog
npm install
npm link
```

### Configuration
Create a `.env` file:
```env
GEMINI_API_KEY=your_key_here
# OR
ANTHROPIC_API_KEY=your_key_here
```

### Usage

#### 🔍 1. Preview the Magic
Summarize what's happening right now and see it in your terminal.
```bash
cdlog explain v1.0.0 HEAD
```

#### ✍️ 2. Build Your History
Automatically prepend the new version to your `CHANGELOG.md` without losing old entries.
```bash
cdlog explain v1.0.0 HEAD --append
```

#### 🚀 3. Official Release
Create a human-readable release directly on GitHub in one go.
```bash
cdlog explain v1.0.0 HEAD --push
```

#### 📂 4. JSON Export
Need to feed the data into a custom dashboard or website?
```bash
cdlog explain v1.0.0 HEAD --format json
```

---

## ⚙️ Advanced Options

### 🧠 Choosing your "Brain"
You can swap between AI models on the fly. As long as you have the keys in your `.env`, it just works.
```bash
# Power through with Gemini 1.5 Flash (Fast & Free)
cdlog explain v1.0.0 HEAD --model gemini-1.5-flash

# Get deep insights with Claude 3 Opus
cdlog explain v1.0.0 HEAD --model claude-3-opus-20240229
```

### 🏷️ Explore Your Versions
Not sure what tags you have? Quickly list the last 10 versions of your project.
```bash
cdlog tags --count 5
```

### 🎯 Targeted Repositories
You don't have to be in the folder to run the command. Just point it to any project.
```bash
cdlog explain v1.0.0 v2.0.0 --repo C:/Users/Projects/MyAwesomeApp
```

---

## 🛠️ Global Configuration

Stop typing flags! Create a `changelog.config.json` file in your repo root to set your permanent preferences.

```bash
cdlog init
```

**Example Config:**
```json
{
  "model": "gemini-1.5-flash",
  "changelogFile": "HISTORY.md",
  "excludeTypes": ["chore", "ci", "test", "style"],
  "github": {
    "draft": true
  }
}
```

## 🛠️ Tech Stack
- **Runtime**: Node.js (ESM)
- **AI**: Gemini 1.5 & Claude 3
- **CLI**: Commander.js
- **UX**: Ora & Chalk

## 📄 License
MIT © 2026
