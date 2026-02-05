#!/usr/bin/env -S npx tsx

import { $ } from 'zx';
import path from 'path';
import fs from 'fs';

async function main() {
  const projectName = process.argv[2];
  if (!projectName) {
    await auditRepository();
    return;
  }

  const potentialPaths = [
    path.join('apps', 'ui-automations', projectName),
    path.join('apps', 'cli-tools', projectName),
    path.join('apps', 'tmp', projectName),
    path.join('apps', projectName),
  ];

  const projectPath = potentialPaths.find((p) => fs.existsSync(p));

  if (!projectPath) {
    console.error(
      `エラー: プロジェクト "${projectName}" が見つかりませんでした。`,
    );
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
    console.log(
      'package.json または pyproject.toml が見つかりませんでした。\n',
    );
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
    console.error(
      'GitHub Issuesの取得中にエラーが発生しました:',
      (error as { stderr: string }).stderr,
    );
  }
}

async function auditRepository() {
  console.log('# Repository-wide Audit: AGENTS.md Compliance\n');

  await checkDirectoryStructure();
  await checkNonNegotiables();
  await checkIssueDocs();

  console.log('## Summary\n');
  console.log('監査が完了しました。上記の「乖離 (Gap)」および「違反 (Violation)」を確認し、リファクタリングを検討してください。');
}

async function checkDirectoryStructure() {
  console.log('## 1. Directory Structure Audit\n');
  const idealStructure = {
    'apps/agents': 'Standalone AI agents',
    'apps/web-bots': 'Browser automation entry points',
    'apps/tools': 'Internal workspace CLI tools',
    'libs/shared': 'Cross-language utilities',
    'libs/typescript': 'TS-specific Page Objects',
    'libs/python': 'Python-specific data logic',
  };

  const gaps: string[] = [];

  for (const [dir, description] of Object.entries(idealStructure)) {
    if (!fs.existsSync(dir)) {
      gaps.push(`- **欠落**: \`${dir}\` (${description}) が存在しません。`);
    }
  }

  // 現状の apps/ 直下を確認
  if (fs.existsSync('apps')) {
    const apps = fs.readdirSync('apps');
    const allowedAppsDirs = ['agents', 'web-bots', 'tools', 'infra'];
    for (const app of apps) {
      if (
        fs.statSync(path.join('apps', app)).isDirectory() &&
        !allowedAppsDirs.includes(app)
      ) {
        gaps.push(
          `- **配置不適切**: \`apps/${app}\` は理想の構造に含まれていません。適切なサブディレクトリ（agents, web-bots, tools等）への移動を検討してください。`,
        );
      }
    }
  }

  if (gaps.length > 0) {
    console.log('### 乖離 (Gaps)\n');
    gaps.forEach((gap) => console.log(gap));
    console.log('');
  } else {
    console.log('ディレクトリ構造は規約に従っています。\n');
  }
}

async function checkNonNegotiables() {
  console.log('## 2. Non-negotiables Audit\n');
  const violations: string[] = [];

  // 1. Language Policy (Japanese in development_logs)
  if (fs.existsSync('development_logs')) {
    const logs = fs.readdirSync('development_logs').filter((f) => f.endsWith('.md'));
    for (const log of logs) {
      const content = fs.readFileSync(path.join('development_logs', log), 'utf-8');
      // 日本語（平仮名・片仮名）が含まれているか簡易チェック
      if (!/[\u3040-\u309F\u30A0-\u30FF]/.test(content)) {
        violations.push(
          `- **言語違反**: \`development_logs/${log}\` に日本語が含まれていない可能性があります。`,
        );
      }
    }
  }

  // 2. No Hardcoded Secrets (Basic check)
  try {
    const stagedFiles = await $`git ls-files`;
    const secretPatterns = [/\.env$/, /\.key$/, /\.pem$/, /credentials\//];
    for (const file of stagedFiles.stdout.split('\n')) {
      if (secretPatterns.some((p) => p.test(file))) {
        violations.push(`- **セキュリティリスク**: 秘密情報と思われるファイル \`${file}\` がリポジトリに含まれています。`);
      }
    }
  } catch (e) {
    // gitが入っていない環境等の考慮
  }

  // 3. Test-First Mandate (Check for test files)
  const sourceFiles: string[] = [];
  const findSources = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (file !== 'node_modules' && file !== '__pycache__') {
          findSources(fullPath);
        }
      } else if (/\.(ts|py)$/.test(file) && !/\.(test|spec)\.ts$/.test(file) && !file.startsWith('test_') && file !== 'index.ts' && file !== '__init__.py') {
        sourceFiles.push(fullPath);
      }
    }
  };

  // apps 配下の src をチェック
  if (fs.existsSync('apps')) {
    const apps = fs.readdirSync('apps');
    for (const app of apps) {
      const srcPath = path.join('apps', app, 'src');
      if (fs.existsSync(srcPath)) findSources(srcPath);
    }
  }

  for (const src of sourceFiles) {
    const ext = path.extname(src);
    const dir = path.dirname(src);
    const base = path.basename(src, ext);
    let testFound = false;

    if (ext === '.ts') {
      testFound = fs.existsSync(path.join(dir, `${base}.test.ts`)) || fs.existsSync(path.join(dir, `${base}.spec.ts`));
    } else if (ext === '.py') {
      testFound = fs.existsSync(path.join(dir, `test_${base}.py`));
    }

    if (!testFound) {
      violations.push(`- **テスト欠落**: \`${src}\` に対するテストファイルが見つかりません。`);
    }
  }

  if (violations.length > 0) {
    console.log('### 違反 (Violations)\n');
    violations.forEach((v) => console.log(v));
    console.log('');
  } else {
    console.log('Non-negotiables は守られています。\n');
  }
}

async function checkIssueDocs() {
  console.log('## 3. Issue Documentation Audit\n');
  const issueDocsDir = path.join('docs', 'issues');
  if (!fs.existsSync(issueDocsDir)) {
    console.log('`docs/issues/` ディレクトリが存在しません。\n');
    return;
  }

  const issues = fs.readdirSync(issueDocsDir);
  const violations: string[] = [];

  for (const issue of issues) {
    const issuePath = path.join(issueDocsDir, issue);
    if (fs.statSync(issuePath).isDirectory()) {
      const required = ['requirements.md', 'design.md', 'tasks.md'];
      for (const req of required) {
        if (!fs.existsSync(path.join(issuePath, req))) {
          violations.push(`- **ドキュメント欠落**: \`docs/issues/${issue}/${req}\` が存在しません。`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.log('### 違反 (Violations)\n');
    violations.forEach((v) => console.log(v));
    console.log('');
  } else {
    console.log('Issueドキュメントの構成は規約に従っています。\n');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
