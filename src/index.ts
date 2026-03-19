import { Command } from "commander";
import { registerKillCommand } from "./commands/index";

const program = new Command();

program
  .name("dools")
  .description("A CLI tool to manage processes")
  .version("1.0.0");

registerKillCommand(program);

program.parse();
