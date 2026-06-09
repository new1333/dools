export { findPidsByPort, killPid, killProcessByPort, whichCommand, getAdapter } from './utils/process';
export { isWindows, isMacOS, isLinux, getPlatform } from './utils/platform';
export type { ProcessInfo, KillResult, Platform, PlatformAdapter } from './types/index';
