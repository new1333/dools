declare const PKG_VERSION: string;

import { Command } from 'commander';
import { findPidsByPort, killPid, whichCommand } from './lib';

const program = new Command();

program
  .name('dools')
  .description('A collection of development utility tools')
  .version(PKG_VERSION);

program
  .command('kill <ports...>')
  .description('Kill the process(es) using the specified port(s)')
  .action(async (ports: string[]) => {
    // Validate all ports up front; fail fast on any invalid input so a typo
    // can't trigger partial unexpected kills.
    const portNumbers: number[] = [];
    for (const port of ports) {
      const portNumber = parseInt(port, 10);

      if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
        console.error(`Error: Invalid port number "${port}". Must be between 1 and 65535`);
        process.exit(1);
      }
      portNumbers.push(portNumber);
    }

    // De-duplicate while preserving the order the user passed them in.
    const uniquePorts = [...new Set(portNumbers)];
    const isMultiple = uniquePorts.length > 1;

    for (const port of uniquePorts) {
      if (isMultiple) console.log('');

      console.log(`Finding processes using port ${port}...`);

      const processes = await findPidsByPort(port);

      if (processes.length === 0) {
        console.log(`No process found using port ${port}`);
        continue;
      }

      const pids = processes.map((p) => p.pid);
      console.log(`Found ${processes.length} process(es): PID ${pids.join(', ')}`);

      for (const pid of pids) {
        try {
          await killPid(pid);
          console.log(`Successfully killed process ${pid}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Failed to kill process ${pid}: ${message}`);
        }
      }
    }
  });

program
  .command('which <command>')
  .description('Find the location of a command')
  .action(async (command: string) => {
    const path = await whichCommand(command);

    if (!path) {
      console.error(`Command not found: ${command}`);
      process.exit(1);
    }

    console.log(path);
  });

program.parse();
