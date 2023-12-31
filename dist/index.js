import { reviewIssue } from "./review-issue";

async function run() {
  try {
    await reviewIssue();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
