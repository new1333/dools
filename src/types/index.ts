export interface ProcessInfo {
  pid: number;
  port: number;
}

export interface KillResult {
  pid: number;
  success: boolean;
  error?: string;
}

export type Platform = 'win32' | 'darwin' | 'linux';

export interface PlatformAdapter {
  findPidsByPort(port: number): Promise<ProcessInfo[]>;
  killPid(pid: number): Promise<void>;
  which(command: string): Promise<string | null>;
}
