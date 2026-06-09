export { findPidsByPort, killPid, killProcessByPort, getAdapter } from './utils/process';
export { isWindows, isMacOS, isLinux, getPlatform } from './utils/platform';
export type { ProcessInfo, KillResult, Platform, PlatformAdapter } from './types/index';
