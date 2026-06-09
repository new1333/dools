import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('platform', () => {
  let getPlatform: () => string;
  let isWindows: () => boolean;
  let isMacOS: () => boolean;
  let isLinux: () => boolean;
  let originalPlatform: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  async function loadWithPlatform(platform: string) {
    Object.defineProperty(process, 'platform', { value: platform });
    vi.resetModules();
    const mod = await import('../src/utils/platform.js');
    getPlatform = mod.getPlatform;
    isWindows = mod.isWindows;
    isMacOS = mod.isMacOS;
    isLinux = mod.isLinux;
  }

  it('detects Windows', async () => {
    await loadWithPlatform('win32');
    expect(getPlatform()).toBe('win32');
    expect(isWindows()).toBe(true);
    expect(isMacOS()).toBe(false);
    expect(isLinux()).toBe(false);
  });

  it('detects macOS', async () => {
    await loadWithPlatform('darwin');
    expect(getPlatform()).toBe('darwin');
    expect(isWindows()).toBe(false);
    expect(isMacOS()).toBe(true);
    expect(isLinux()).toBe(false);
  });

  it('detects Linux', async () => {
    await loadWithPlatform('linux');
    expect(getPlatform()).toBe('linux');
    expect(isWindows()).toBe(false);
    expect(isMacOS()).toBe(false);
    expect(isLinux()).toBe(true);
  });
});
