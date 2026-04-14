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
git clone https://github.com/YOUR_USERNAME/cdlog.git
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
```bash
# Generate and display in terminal
cdlog explain v1.0.0 HEAD

# Save to CHANGELOG.md
cdlog explain v1.0.0 HEAD --output CHANGELOG.md

# Push directly to GitHub Releases
cdlog explain v1.0.0 HEAD --push
```

## 🛠️ Tech Stack
- **Runtime**: Node.js (ESM)
- **AI**: Gemini 1.5 & Claude 3
- **CLI**: Commander.js
- **UX**: Ora & Chalk

## 📄 License
MIT © 2026
