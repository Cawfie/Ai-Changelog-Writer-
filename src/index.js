#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { loadConfig } from './config.js';
import { loadProjectConfig } from './project-config.js';
import { generateChangelog } from './changelog.js';
import { appendToChangelog } from './file-manager.js';
import { pushToGitHubRelease } from './github.js';
import { listTags } from './git.js';

const program = new Command();

program
  .name('changelog-ai')
  .description('AI-powered changelog generator from git history')
  .version('1.0.0');

program
  .command('generate')
  .alias('gen')
  .alias('explain')
  .description('Generate changelog between two tags/commits')
  .argument('<from>', 'start tag or commit hash')
  .argument('<to>', 'end tag or commit hash')
  .option('-o, --output <file>', 'save to file instead of printing to stdout')
  .option('-r, --repo <path>', 'path to git repo', process.cwd())
  .option('--append', 'prepend new entry into existing CHANGELOG.md')
  .option('--push', 'create a GitHub Release after generating')
  .option('--draft', 'create GitHub Release as draft')
  .option('--tag <tag>', 'override release tag name')
  .option('--model <model>', 'LLM model to use')
  .option('--format <fmt>', 'markdown or json')
  .action(async (from, to, options) => {
    const spinner = ora('Generating changelog...').start();
    try {
      const keys = loadConfig();
      const projConfig = loadProjectConfig(options.repo);

      const resolvedOpts = {
        repoPath: options.repo,
        model: options.model || projConfig.model,
        format: options.format || projConfig.format,
        excludeTypes: projConfig.excludeTypes,
        output: options.output || null,
        append: options.append || false,
        push: options.push || false,
        draft: options.draft !== undefined ? options.draft : projConfig.github.draft,
        tag: options.tag || to
      };

      const apiKey = resolvedOpts.model.includes('gemini') ? keys.geminiKey : keys.anthropicKey;
      if (!apiKey && resolvedOpts.format !== 'json') {
          spinner.fail(chalk.red(`Missing API key for ${resolvedOpts.model}`));
          process.exit(1);
      }

      spinner.text = `Fetching commits on ${resolvedOpts.repoPath} (${from}...${to})...`;
      
      const changelog = await generateChangelog({
        from,
        to,
        repoPath: resolvedOpts.repoPath,
        model: resolvedOpts.model,
        apiKey,
        excludeTypes: resolvedOpts.excludeTypes,
        format: resolvedOpts.format
      });

      spinner.succeed(chalk.green('Changelog generated successfully!'));

      let outPath = null;
      if (options.output) {
         outPath = path.resolve(resolvedOpts.repoPath, options.output);
         fs.writeFileSync(outPath, changelog);
         console.log(chalk.cyan(`Saved to ${outPath}`));
      } else if (options.append) {
         outPath = appendToChangelog(resolvedOpts.repoPath, projConfig.changelogFile || 'CHANGELOG.md', changelog, to);
         console.log(chalk.cyan(`Appended to ${outPath}`));
      } else {
         console.log('\n' + changelog + '\n');
      }

      if (resolvedOpts.push) {
        let ghSpinner = ora('Pushing release to GitHub...').start();
        try {
          if (!keys.githubToken) throw new Error('GITHUB_TOKEN missing');
          const releaseData = await pushToGitHubRelease({
            repoPath: resolvedOpts.repoPath,
            tag: resolvedOpts.tag,
            body: changelog,
            draft: resolvedOpts.draft,
            token: keys.githubToken
          });
          ghSpinner.succeed(chalk.green(`Pushed release to GitHub: ${releaseData.html_url}`));
        } catch (e) {
          ghSpinner.fail(chalk.red(`GitHub Release failed: ${e.message}`));
        }
      }

    } catch (e) {
      spinner.fail(chalk.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

program
  .command('tags')
  .description('List recent tags in the repo')
  .option('-r, --repo <path>', 'repo path', process.cwd())
  .option('-n, --count <n>', 'how many tags to show', 10)
  .action((options) => {
    try {
      const tags = listTags(options.repo, parseInt(options.count, 10));
      if (!tags.length) console.log(chalk.yellow('No tags found.'));
      tags.forEach(t => console.log(chalk.blue(`• ${t}`)));
    } catch (e) {
      console.error(chalk.red(e.message));
    }
  });

program
  .command('init')
  .description('Create a changelog.config.json with defaults')
  .action(() => {
    const configPath = path.join(process.cwd(), 'changelog.config.json');
    const DEFAULTS = {
      model: 'claude-sonnet-4-20250514',
      changelogFile: 'CHANGELOG.md',
      excludeTypes: ['chore', 'ci', 'test', 'style'],
      includeInternal: false,
      format: 'markdown',
      github: {
        draft: false,
        prerelease: false
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(DEFAULTS, null, 2));
    console.log(chalk.green('Created changelog.config.json successfully.'));
  });

program
  .command('config')
  .description('Show resolved config for current repo')
  .option('-r, --repo <path>', 'repo path', process.cwd())
  .action((options) => {
    const pc = loadProjectConfig(options.repo);
    console.log(chalk.cyan(JSON.stringify(pc, null, 2)));
  });

program.parse(process.argv);
