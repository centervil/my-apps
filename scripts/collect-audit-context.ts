#!/usr/bin/env zx

import { $ } from 'zx';
import path from 'path';
import fs from 'fs';

async function main() {
  const projectName = process.argv[2];
  if (!projectName) {
    console.error('エラー: プロジェクト名が指定されていません。');
    process.exit(1);
  }

  const potentialPaths = [
    path.join('apps', 'ui-automations', projectName),
    path.join('apps', 'cli-tools', projectName),
    path.join('apps', 'tmp', projectName),
    path.join('apps', projectName),
  ];

  const projectPath = potentialPaths.find(p => fs.existsSync(p));

  if (!projectPath) {
    console.error(`エラー: プロジェクト "${projectName}" が見つかりませんでした。`);
    process.exit(1);
  }

  console.log(`# Project Audit: ${projectName}\n`);

  // 1. README.md
  console.log('## README.md\n');
  const readmePath = path.join(projectPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const content = await fs.promises.readFile(readmePath, 'utf-8');
    console.log(`\
\
${content}\
\
`);
  } else {
    console.log('README.md が見つかりませんでした。\n');
  }

  // 2. package.json or pyproject.toml
  console.log('## Project Definition File\n');
  const packageJsonPath = path.join(projectPath, 'package.json');
  const pyprojectTomlPath = path.join(projectPath, 'pyproject.toml');

  if (fs.existsSync(packageJsonPath)) {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
    console.log(`### package.json\n\
\
${content}\
\
`);
  } else if (fs.existsSync(pyprojectTomlPath)) {
    const content = await fs.promises.readFile(pyprojectTomlPath, 'utf-8');
    console.log(`### pyproject.toml\n\
\
${content}\
\
`);
  } else {
    console.log('package.json または pyproject.toml が見つかりませんでした。\n');
  }

  // 3. Directory structure
  console.log('## Directory Structure\n');
  for (const dir of ['src', 'scripts']) {
    const dirPath = path.join(projectPath, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`### ./${dir}\n`);
      const tree = await $`ls -R ${dirPath}`;
      console.log(`\
\
${tree.stdout}\
\
`);
    }
  }

  // 4. GitHub Issues
  try {
    console.log('## Open GitHub Issues\n');
    const ownerResult = await $`gh repo view --json owner -q '.owner.login'`;
    const owner = ownerResult.stdout.trim();
    const nameResult = await $`gh repo view --json name -q '.name'`;
    const name = nameResult.stdout.trim();
    const repo = `${owner}/${name}`;

    if (repo) {
        const issues = await $`gh issue list --repo ${repo} --state open`;
        console.log(`\
\
${issues.stdout}\
\
`);
    } else {
        console.log('GitHubリポジトリの情報を取得できませんでした。');
    }
  } catch (error) {
    console.error('GitHub Issuesの取得中にエラーが発生しました:', (error as any).stderr);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
