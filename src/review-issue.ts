import { Octokit } from "@octokit/rest";
import { context } from "@actions/github";
import OpenAI from "openai";

const githubToken = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: githubToken });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const issueNumber = context.issue.number;
const owner = context.repo.owner;
const repo = context.repo.repo;

const { data: issue } = await octokit.issues.get({
  owner,
  repo,
  issue_number: issueNumber,
});

const title = issue.title;
const body = issue.body;
const model = issue.labels.includes("issue review 4")
  ? "gpt-4-1106-preview"
  : "gpt-3.5-turbo";
const language = process.env.ISSUE_LANGUAGE ?? "en";

async function reviewIssue() {
  const label = await getLabelFromTitle(title);

  const prompt = createPrompt(label, title, body, language);

  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: model,
  });

  const reviewComment = response.choices[0].message.content?.trim();

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: reviewComment ?? "No comment",
  });
}

async function getLabelFromTitle(title: string): Promise<string> {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Classify the following issue title into one of these categories: Bug, Feature, Question, Enhancement, Documentation, Help Wanted, Good First Issue. Title: "${title}"`,
      },
    ],
    model: model,
  });

  const labelResponse = response.choices[0].message.content?.trim();
  return determineLabelFromResponse(labelResponse ?? "Unknown");
}

function determineLabelFromResponse(response: string): string {
  if (response.includes("Bug")) {
    return "Bug";
  } else if (response.includes("Feature")) {
    return "Feature";
  } else if (response.includes("Question")) {
    return "Question";
  } else if (response.includes("Enhancement")) {
    return "Enhancement";
  } else if (response.includes("Documentation")) {
    return "Documentation";
  } else if (response.includes("Help Wanted")) {
    return "Help Wanted";
  } else if (response.includes("Good First Issue")) {
    return "Good First Issue";
  } else {
    return "Unknown";
  }
}
function createPrompt(
  label: string,
  title: string,
  body: string | null | undefined,
  language: string
) {
  let prompt = `IMPORTANT: Entire response must be in the language with ISO code: ${language}.\n\nYou are a seasoned engineer and Issue Review Professional.\n
  Please respond appropriately according to the following 3 STEPs.`;

  // Step 1: Display the classified label
  prompt += `1. Classified Label: ${label}\n\nThis is simply a matter of labeling the issue.\n\n`;

  // Step 2: Review the issue based on the label
  prompt += `2. Issue Review\nReview the Issue based on the following information.\n`;

  // Instruct to review the title and description
  prompt += `The title is here:"${title}"`;
  if (body) {
    prompt += `The body is here:"${body}"`;
  }
  prompt += ` and provide a detailed analysis based on the label category.\n`;

  // Add specific review points based on the label
  switch (label.toLowerCase()) {
    case "bug":
      prompt += `
      - Analyze if the cause and reproduction steps of the bug are clearly and accurately described.
      - Assess if the expected outcomes and impact of the bug are well-defined and realistic.
      - Suggest any additional notes or considerations that might enhance the clarity or completeness of the issue.`;
      break;
    case "feature":
      prompt += `
      - Evaluate if the purpose and specifications of the feature are clear, understandable, and well-articulated.
      - Determine if the criteria for completion (Close conditions) are clear, appropriate, and achievable.
      - Recommend any additional notes or considerations that could improve the feature proposal.`;
      break;
    case "question":
      prompt += `
      - Examine if the question is presented clearly and concisely.
      - Check if the context and background of the question are adequately provided.
      - Identify any specific points that need further clarification or elaboration.`;
      break;
    case "enhancement":
      prompt += `
      - Scrutinize if the proposed improvements and their reasons are clearly and convincingly described.
      - Verify if the summary is clear, understandable, and accessible to all intended audiences.
      - Propose any additional notes or considerations that could refine the enhancement suggestion.`;
      break;
    case "documentation":
      prompt += `
      - Review if the documentation change is specific, relevant, and well-justified.
      - Assess if the reasons for the change and its expected impact are clearly explained.
      - Offer any additional notes or considerations that could enrich the documentation update.`;
      break;
    case "help wanted":
      prompt += `
      - Analyze if the required assistance and its context are clearly and effectively communicated.
      - Evaluate if the criteria for completion (Close conditions) are clear, appropriate, and well-defined.
      - Suggest any specific skills or knowledge that are essential for addressing the help request.`;
      break;
    case "good first issue":
      prompt += `
      - Determine if the issue is approachable and suitable for beginners.
      - Check if the instructions and expected outcomes are clear, concise, and encouraging.
      - Recommend any additional resources or guidance that could support newcomers tackling this issue.`;
      break;
    default:
      prompt += `
      - Review if the issue title and description are clear, concise, and effectively communicate the core issue.
      - Assess if the goals and expectations of the issue are well-defined and realistic.
      - Suggest any additional notes or considerations that could enhance the overall clarity and effectiveness of the issue.`;
  }

  prompt += `\n`;

  // Step 3: Suggest improvements for a better issue
  prompt += `3. Suggestions for a Better Issue:\n`;
  prompt += `Based on the review, suggest improvements for a clearer and more effective issue. Consider the clarity of the title, the completeness of the description, and any additional notes or considerations that might help.\n`;

  return prompt;
}

reviewIssue().catch((error) => {
  console.error(error);
  process.exit(1);
});
