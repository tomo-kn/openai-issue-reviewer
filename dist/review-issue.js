import { Octokit } from "@octokit/rest";
import { context } from "@actions/github";
import OpenAI from "openai";
const githubToken = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: githubToken });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
async function reviewIssue() {
  const issueNumber = context.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const { data: issue } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const title = issue.title;
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Review the following issue title and provide insights: "${title}"`,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  const reviewComment = response.choices[0].message.content?.trim();

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: reviewComment ?? "No comment",
  });
}
reviewIssue().catch((error) => {
  console.error(error);
  process.exit(1);
});
