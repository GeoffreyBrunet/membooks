/**
 * Development script - runs API and Mobile app concurrently
 */

const colors = {
  api: "\x1b[36m", // cyan
  mobile: "\x1b[35m", // magenta
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

console.log(`${colors.bold}Starting Membooks development servers...${colors.reset}\n`);

const apiProcess = Bun.spawn(["bun", "run", "dev"], {
  cwd: "./api",
  stdout: "pipe",
  stderr: "pipe",
});

const mobileProcess = Bun.spawn(["bunx", "expo", "start"], {
  cwd: "./mobile",
  stdout: "pipe",
  stderr: "pipe",
  stdin: "inherit",
});

async function streamOutput(
  reader: ReadableStream<Uint8Array>,
  prefix: string,
  color: string
) {
  const textDecoder = new TextDecoder();
  for await (const chunk of reader) {
    const text = textDecoder.decode(chunk);
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${prefix}]${colors.reset} ${line}`);
      }
    }
  }
}

streamOutput(apiProcess.stdout, "API", colors.api);
streamOutput(apiProcess.stderr, "API", colors.api);
streamOutput(mobileProcess.stdout, "MOBILE", colors.mobile);
streamOutput(mobileProcess.stderr, "MOBILE", colors.mobile);

process.on("SIGINT", () => {
  console.log("\n\nShutting down...");
  apiProcess.kill();
  mobileProcess.kill();
  process.exit(0);
});

await Promise.all([apiProcess.exited, mobileProcess.exited]);
