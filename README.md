# dools

A cross-platform collection of development utility tools, usable as both CLI and library.

## CLI Usage

Install globally:

```bash
npm install -g dools
```

Kill a process occupying a port:

```bash
dools kill 3000
```

Or use without installing:

```bash
npx dools kill 3000
```

## Library Usage

Install as a dependency:

```bash
npm install dools
```

```typescript
import { findPidsByPort, killPid, killProcessByPort } from 'dools';

// Find processes using port 3000
const processes = await findPidsByPort(3000);
// => [{ pid: 12345, port: 3000 }, ...]

// Kill a specific PID
await killPid(12345);

// Find and kill all processes on a port
const results = await killProcessByPort(3000);
// => [{ pid: 12345, success: true }, { pid: 12346, success: false, error: '...' }]
```

## API

### `findPidsByPort(port: number): Promise<ProcessInfo[]>`

Find all processes occupying the specified port. Returns an array of `ProcessInfo` objects.

### `killPid(pid: number): Promise<void>`

Kill a process by PID. Throws on failure.

### `killProcessByPort(port: number): Promise<KillResult[]>`

Find and kill all processes on the specified port. Returns results for each attempt, including errors.

### `getAdapter(): PlatformAdapter`

Get the platform-specific adapter for the current OS. Useful for extending with custom behavior.

## Types

```typescript
interface ProcessInfo {
  pid: number;
  port: number;
}

interface KillResult {
  pid: number;
  success: boolean;
  error?: string;
}

interface PlatformAdapter {
  findPidsByPort(port: number): Promise<ProcessInfo[]>;
  killPid(pid: number): Promise<void>;
}

type Platform = 'win32' | 'darwin' | 'linux';
```

## Requirements

- Node.js >= 16
- Windows, macOS, or Linux

## License

MIT
