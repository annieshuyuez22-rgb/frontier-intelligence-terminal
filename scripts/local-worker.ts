import { runWorkerCycle } from "../src/lib/job-engine";

const once = process.env.WORKER_ONCE === "true";
const configuredInterval = Number(process.env.WORKER_POLL_MS ?? 5_000);
const intervalMs = Number.isFinite(configuredInterval) ? Math.min(Math.max(configuredInterval, 1_000), 60_000) : 5_000;
let stopping = false;

function stop(signal: string): void {
  stopping = true;
  console.log(`Received ${signal}; finishing the current worker cycle`);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  let failures = 0;
  do {
    try {
      const results = await runWorkerCycle(Number(process.env.WORKER_BATCH_SIZE ?? 5));
      failures = 0;
      if (results.length > 0) {
        console.log(JSON.stringify({ time: new Date().toISOString(), results }));
      }
    } catch (error) {
      failures += 1;
      if (once) process.exitCode = 1;
      console.error("Worker cycle failed:", error instanceof Error ? error.message : error);
    }
    if (!once && !stopping) await sleep(Math.min(intervalMs * Math.max(failures, 1), 60_000));
  } while (!once && !stopping);
}

main().catch((error: unknown) => {
  console.error("Worker stopped unexpectedly:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
