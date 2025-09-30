import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';

export default async function pythonExecutor(
  options: unknown,
  context: ExecutorContext,
) {
  console.log('Executing Python script...');
  const projectName = context.projectName;
  if (!projectName) {
    throw new Error('No project name found in context');
  }

  try {
    execSync(`poetry run cli`, { stdio: 'inherit' });
    return { success: true };
  } catch (e) {
    console.error(`Error executing ${projectName}:`, e);
    return { success: false };
  }
}
