import { reviewIssue } from "./reviewIssue";

async function run() {
  try {
    await reviewIssue();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
