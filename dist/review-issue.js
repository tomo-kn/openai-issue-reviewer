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
    const body = issue.body;
    const language = process.env.ISSUE_LANGUAGE ?? "en";
    const label = await getLabelFromTitle(title);
    const prompt = createPrompt(label, title, body, language);
    const response = await openai.chat.completions.create({
        messages: [
            {
                role: "user",
                content: prompt,
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
async function getLabelFromTitle(title) {
    const response = await openai.chat.completions.create({
        messages: [
            {
                role: "user",
                content: `Classify the following issue title into one of these categories: Bug, Feature, Question, Enhancement, Documentation, Help Wanted, Good First Issue. Title: "${title}"`,
            },
        ],
        model: "gpt-3.5-turbo",
    });
    const labelResponse = response.choices[0].message.content?.trim();
    return determineLabelFromResponse(labelResponse ?? "Unknown");
}
function determineLabelFromResponse(response) {
    if (response.includes("Bug")) {
        return "Bug";
    }
    else if (response.includes("Feature")) {
        return "Feature";
    }
    else if (response.includes("Question")) {
        return "Question";
    }
    else if (response.includes("Enhancement")) {
        return "Enhancement";
    }
    else if (response.includes("Documentation")) {
        return "Documentation";
    }
    else if (response.includes("Help Wanted")) {
        return "Help Wanted";
    }
    else if (response.includes("Good First Issue")) {
        return "Good First Issue";
    }
    else {
        return "Unknown";
    }
}
function createPrompt(label, title, body, language) {
    let prompt = `IMPORTANT: Entire response must be in the language with ISO code: ${language}. Review the following issue with title "${title}"`;
    if (body) {
        prompt += ` and description: "${body}"`;
    }
    prompt +=
        ". Please suggest improvements for a clearer and more effective issue based on the following points:";
    switch (label.toLowerCase()) {
        case "bug":
            prompt += `
        - Is the cause and reproduction steps of the bug clear?
        - Are the expected outcomes and impact of the bug well-defined?
        - Are there any additional notes or considerations?`;
            break;
        case "feature":
            prompt += `
        - Is the purpose and specification of the feature clear and understandable?
        - Are the criteria for completion (Close conditions) clear and appropriate?
        - Are there any additional notes or considerations?`;
            break;
        case "question":
            prompt += `
        - Is the question clear and concise?
        - Are the context and background of the question provided?
        - Are there any specific points that need clarification?`;
            break;
        case "enhancement":
            prompt += `
        - Are the proposed improvements and their reasons clearly described?
        - Is the summary clear and understandable to everyone?
        - Are the criteria for completion (Close conditions) clear and appropriate?
        - Are there any additional notes or considerations?`;
            break;
        case "documentation":
            prompt += `
        - Is the documentation change specific and relevant?
        - Are the reasons for the change and its impact clearly explained?
        - Are there any additional notes or considerations?`;
            break;
        case "help wanted":
            prompt += `
        - Is the required assistance and its context clearly stated?
        - Are the criteria for completion (Close conditions) clear and appropriate?
        - Are there any specific skills or knowledge required?`;
            break;
        case "good first issue":
            prompt += `
        - Is the issue approachable for beginners?
        - Are the instructions and expected outcomes clear?
        - Are there any additional resources or guidance provided?`;
            break;
        default:
            prompt += `
        - Is the issue title and description clear and concise?
        - Are the goals and expectations of the issue well-defined?
        - Are there any additional notes or considerations?`;
    }
    return prompt;
}
reviewIssue().catch((error) => {
    console.error(error);
    process.exit(1);
});
