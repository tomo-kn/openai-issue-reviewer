import { reviewIssue } from "./review-issue.js";
async function run() {
    try {
        await reviewIssue();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}
run();
