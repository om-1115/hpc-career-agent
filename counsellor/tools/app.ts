// The app side of the counsellor's tools. Each tool in this folder calls the
// app's own, tested implementation (server/counsellor/tools.ts) through here,
// so the agent reads and writes exactly what the app's screens do.
import { fileURLToPath } from "node:url";
import { Store } from "../../server/lib/store.ts";
import { runTool } from "../../server/counsellor/tools.ts";

// In AgentFoundry the tools act for one demo student (seed the demo school
// with `npm run seed:demo` at the repo root). In the app, the server passes
// the signed-in student instead, so the model never chooses whose data it reads.
const ctx = {
  store: new Store(process.env.DATA_FILE ?? fileURLToPath(new URL("../../.data/db.json", import.meta.url))),
  studentCode: process.env.COUNSELLOR_DEMO_STUDENT ?? "S002",
};

// AgentFoundry's Tools → Test runs `tsx -e <wrapper> -- <args JSON>` and reads
// the JSON from argv[2], but tsx puts it at argv[1], so the tool gets {}. Until
// AF fixes that, take the JSON from argv[1] when a test passes no arguments.
// (When the agent runs, argv[1] is the script path, so this never applies.)
function withTestArgs(args: unknown): unknown {
  if (args && typeof args === "object" && Object.keys(args).length > 0) return args;
  try {
    const parsed = JSON.parse(process.argv[1] ?? "");
    return parsed && typeof parsed === "object" ? parsed : args;
  } catch {
    return args;
  }
}

/** Runs a tool against the app and returns its answer as JSON text for the model. */
export const callApp = async (name: string, args: unknown) => JSON.stringify(await runTool(ctx, name, withTestArgs(args)));
