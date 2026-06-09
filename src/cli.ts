declare const PKG_VERSION: string;

import { Command } from 'commander';
import { findPidsByPort, killPid } from './lib';

const program = new Command();

program
  .name('dools')
  .description('A collection of development utility tools')
  .version(PKG_VERSION);

program
  .command('kill <port>')
  .description('Kill the process using the specified port')
  .action(async (port: string) => {
    const portNumber = parseInt(port, 10);

    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      console.error('Error: Invalid port number. Must be between 1 and 65535');
      process.exit(1);
    }

    console.log(`Finding processes using port ${portNumber}...`);

    const processes = await findPidsByPort(portNumber);

    if (processes.length === 0) {
      console.log(`No process found using port ${portNumber}`);
      return;
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
  });

program.parse();
