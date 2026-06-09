import { exec } from 'child_process';
import { promisify } from 'util';
import type { KillResult, PlatformAdapter, ProcessInfo } from '../types/index';
import { isWindows } from './platform';

const execAsync = promisify(exec);

const windowsAdapter: PlatformAdapter = {
  async findPidsByPort(port: number): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr LISTENING`);
      const lines = stdout.trim().split('\n').filter(Boolean);
      const seen = new Set<number>();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const localAddr = parts[1] ?? '';
        const portStr = localAddr.split(':').pop();
        if (portStr === String(port)) {
          const pid = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(pid) && pid > 0 && !seen.has(pid)) {
            seen.add(pid);
          }
        }
      }

      return Array.from(seen).map((pid) => ({ pid, port }));
    } catch {
      return [];
    }
  },

  async killPid(pid: number): Promise<void> {
    await execAsync(`taskkill /PID ${pid} /F`);
  },

  async which(command: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`where ${command}`);
      const first = stdout.trim().split('\n')[0]?.trim();
      return first || null;
    } catch {
      return null;
    }
  },
};

const unixAdapter: PlatformAdapter = {
  async findPidsByPort(port: number): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync(`lsof -i :${port} -t`);
      const pids = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((pid) => parseInt(pid, 10))
        .filter((pid) => !isNaN(pid));

      return [...new Set(pids)].map((pid) => ({ pid, port }));
    } catch {
      return [];
    }
  },

  async killPid(pid: number): Promise<void> {
    await execAsync(`kill -9 ${pid}`);
  },

  async which(command: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`which ${command}`);
      const first = stdout.trim().split('\n')[0]?.trim();
      return first || null;
    } catch {
      return null;
    }
  },
};

export function getAdapter(): PlatformAdapter {
  return isWindows() ? windowsAdapter : unixAdapter;
}

export async function findPidsByPort(port: number): Promise<ProcessInfo[]> {
  return getAdapter().findPidsByPort(port);
}

export async function killPid(pid: number): Promise<void> {
  return getAdapter().killPid(pid);
}

export async function killProcessByPort(port: number): Promise<KillResult[]> {
  const processes = await findPidsByPort(port);
  const results: KillResult[] = [];

  for (const { pid } of processes) {
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

export async function whichCommand(command: string): Promise<string | null> {
  return getAdapter().which(command);
}
