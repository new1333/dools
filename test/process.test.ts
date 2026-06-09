import { describe, it, expect, vi, beforeEach } from "vitest";
import { exec } from "child_process";

const mockExec = vi.mocked(exec);

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

vi.mock("../src/utils/platform.js", () => ({
  isWindows: vi.fn(),
  getPlatform: vi.fn(),
}));

function reply(error: Error | null, result: { stdout: string; stderr: string }) {
  mockExec.mockImplementation(
    ((_cmd: string, cb: (err: Error | null, res: { stdout: string; stderr: string }) => void) => {
      cb(error, result);
    }) as any,
  );
}

describe("process utils", () => {
  let findPidsByPort: (port: number) => Promise<import("../src/types/index.js").ProcessInfo[]>;
  let killPid: (pid: number) => Promise<void>;
  let killProcessByPort: (port: number) => Promise<import("../src/types/index.js").KillResult[]>;
  let getAdapter: () => import("../src/types/index.js").PlatformAdapter;
  let isWindows: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const platformMod = await import("../src/utils/platform.js");
    isWindows = platformMod.isWindows as ReturnType<typeof vi.fn>;
    const processMod = await import("../src/utils/process.js");
    findPidsByPort = processMod.findPidsByPort;
    killPid = processMod.killPid;
    killProcessByPort = processMod.killProcessByPort;
    getAdapter = processMod.getAdapter;
  });

  describe("Windows adapter", () => {
    beforeEach(() => {
      isWindows.mockReturnValue(true);
    });

    it("finds PIDs by parsing netstat output", async () => {
      reply(null, {
        stdout: [
          "  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234",
          "  TCP    [::]:3000              [::]:0                 LISTENING       5678",
        ].join("\n"),
        stderr: "",
      });

      const results = await findPidsByPort(3000);
      expect(results).toEqual([
        { pid: 1234, port: 3000 },
        { pid: 5678, port: 3000 },
      ]);
    });

    it("does not match partial ports", async () => {
      reply(null, {
        stdout: [
          "  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       1234",
          "  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       5678",
          "  TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       9999",
        ].join("\n"),
        stderr: "",
      });

      const results = await findPidsByPort(80);
      expect(results).toEqual([{ pid: 5678, port: 80 }]);
    });

    it("deduplicates PIDs", async () => {
      reply(null, {
        stdout: [
          "  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234",
          "  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234",
        ].join("\n"),
        stderr: "",
      });

      const results = await findPidsByPort(3000);
      expect(results).toEqual([{ pid: 1234, port: 3000 }]);
    });

    it("returns empty array when no processes found", async () => {
      reply(new Error("not found"), { stdout: "", stderr: "" });

      const results = await findPidsByPort(3000);
      expect(results).toEqual([]);
    });

    it("kills process with taskkill", async () => {
      reply(null, { stdout: "", stderr: "" });

      await killPid(1234);
      expect(mockExec).toHaveBeenCalledWith(
        "taskkill /PID 1234 /F",
        expect.any(Function),
      );
    });
  });

  describe("Unix adapter", () => {
    beforeEach(() => {
      isWindows.mockReturnValue(false);
    });

    it("finds PIDs by parsing lsof output", async () => {
      reply(null, { stdout: "1234\n5678\n", stderr: "" });

      const results = await findPidsByPort(3000);
      expect(results).toEqual([
        { pid: 1234, port: 3000 },
        { pid: 5678, port: 3000 },
      ]);
    });

    it("deduplicates PIDs", async () => {
      reply(null, { stdout: "1234\n1234\n", stderr: "" });

      const results = await findPidsByPort(3000);
      expect(results).toEqual([{ pid: 1234, port: 3000 }]);
    });

    it("returns empty array when lsof fails", async () => {
      reply(new Error("not found"), { stdout: "", stderr: "" });

      const results = await findPidsByPort(3000);
      expect(results).toEqual([]);
    });

    it("kills process with kill -9", async () => {
      reply(null, { stdout: "", stderr: "" });

      await killPid(1234);
      expect(mockExec).toHaveBeenCalledWith("kill -9 1234", expect.any(Function));
    });
  });

  describe("getAdapter", () => {
    it("returns Windows adapter on win32", () => {
      isWindows.mockReturnValue(true);
      expect(getAdapter()).toBeDefined();
    });

    it("returns Unix adapter on non-Windows", () => {
      isWindows.mockReturnValue(false);
      expect(getAdapter()).toBeDefined();
    });
  });

  describe("killProcessByPort", () => {
    it("kills all processes and returns results", async () => {
      isWindows.mockReturnValue(false);
      let callCount = 0;
      mockExec.mockImplementation(((_cmd: string, cb: Function) => {
        callCount++;
        if (callCount === 1) {
          cb(null, { stdout: "1234\n5678\n", stderr: "" });
        } else {
          cb(null, { stdout: "", stderr: "" });
        }
      }) as any);

      const results = await killProcessByPort(3000);
      expect(results).toEqual([
        { pid: 1234, success: true },
        { pid: 5678, success: true },
      ]);
    });

    it("handles partial failures", async () => {
      isWindows.mockReturnValue(false);
      let callCount = 0;
      mockExec.mockImplementation(((_cmd: string, cb: Function) => {
        callCount++;
        if (callCount === 1) {
          cb(null, { stdout: "1234\n5678\n", stderr: "" });
        } else if (callCount === 2) {
          cb(null, { stdout: "", stderr: "" });
        } else {
          cb(new Error("permission denied"), { stdout: "", stderr: "" });
        }
      }) as any);

      const results = await killProcessByPort(3000);
      expect(results).toEqual([
        { pid: 1234, success: true },
        { pid: 5678, success: false, error: "permission denied" },
      ]);
    });

    it("returns empty results when no processes found", async () => {
      isWindows.mockReturnValue(false);
      reply(new Error("not found"), { stdout: "", stderr: "" });

      const results = await killProcessByPort(3000);
      expect(results).toEqual([]);
    });
  });
});
