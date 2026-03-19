import { exec } from 'child_process';
import { promisify } from 'util';
import type { KillResult } from '../types/index';
import { isWindows } from './platform';

const execAsync = promisify(exec);

/**
 * 查找占用指定端口的进程 PID
 */
export async function findPidsByPort(port: number): Promise<number[]> {
  if (isWindows()) {
    return findPidsWindows(port);
  }
  return findPidsUnix(port);
}

async function findPidsWindows(port: number): Promise<number[]> {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n').filter(Boolean);
    const pids = new Set<number>();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(pid) && pid > 0) {
        pids.add(pid);
      }
    }

    return Array.from(pids);
  } catch {
    return [];
  }
}

async function findPidsUnix(port: number): Promise<number[]> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -t`);
    const pids = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((pid) => parseInt(pid, 10))
      .filter((pid) => !isNaN(pid));

    return [...new Set(pids)];
  } catch {
    return [];
  }
}

/**
 * 终止指定 PID 的进程
 */
export async function killPid(pid: number): Promise<void> {
  if (isWindows()) {
    await execAsync(`taskkill /PID ${pid} /F`);
  } else {
    await execAsync(`kill -9 ${pid}`);
  }
}

/**
 * 终止占用指定端口的所有进程
 */
export async function killProcessByPort(port: number): Promise<KillResult[]> {
  const pids = await findPidsByPort(port);
  const results: KillResult[] = [];

  for (const pid of pids) {
    try {
      await killPid(pid);
      results.push({ pid, success: true });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ pid, success: false, error });
    }
  }

  return results;
}
