import type { Platform } from '../types/index';

export function getPlatform(): Platform {
  return process.platform as Platform;
}

export function isWindows(): boolean {
  return getPlatform() === 'win32';
}

export function isMacOS(): boolean {
  return getPlatform() === 'darwin';
}

export function isLinux(): boolean {
  return getPlatform() === 'linux';
}
