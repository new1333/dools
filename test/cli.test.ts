import { describe, it, expect, beforeAll } from "vitest";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const bin = "node";
const binArgs = ["bin/dools.js"];

describe("CLI", () => {
  beforeAll(async () => {
    // Ensure the project is built
    const { exec } = require("child_process");
    const execAsync = promisify(exec);
    await execAsync("npm run build", { cwd: process.cwd() });
  });

  it("shows help", async () => {
    const { stdout } = await execFileAsync(bin, [...binArgs, "--help"]);
    expect(stdout).toContain("dools");
    expect(stdout).toContain("kill");
  });

  it("rejects invalid port - non-numeric", async () => {
    try {
      await execFileAsync(bin, [...binArgs, "kill", "abc"]);
      expect.unreachable("Should have exited with error");
    } catch (err: any) {
      expect(err.stderr).toContain("Invalid port number");
      expect(err.code).not.toBe(0);
    }
  });

  it("rejects invalid port - out of range (0)", async () => {
    try {
      await execFileAsync(bin, [...binArgs, "kill", "0"]);
      expect.unreachable("Should have exited with error");
    } catch (err: any) {
      expect(err.stderr).toContain("Invalid port number");
    }
  });

  it("rejects invalid port - out of range (65536)", async () => {
    try {
      await execFileAsync(bin, [...binArgs, "kill", "65536"]);
      expect.unreachable("Should have exited with error");
    } catch (err: any) {
      expect(err.stderr).toContain("Invalid port number");
    }
  });

  it("shows no process found for unused port", async () => {
    const { stdout } = await execFileAsync(bin, [...binArgs, "kill", "59999"]);
    expect(stdout).toContain("No process found using port 59999");
  });

  it("which finds node", async () => {
    const { stdout } = await execFileAsync(bin, [...binArgs, "which", "node"]);
    expect(stdout.trim()).toContain("node");
    expect(stdout.trim().length).toBeGreaterThan(0);
  });

  it("which shows error for nonexistent command", async () => {
    try {
      await execFileAsync(bin, [...binArgs, "which", "nonexistent-command-xyz"]);
      expect.unreachable("Should have exited with error");
    } catch (err: any) {
      expect(err.stderr).toContain("Command not found: nonexistent-command-xyz");
    }
  });
});
