# openai-issue-reviewer

Automated issues reviewing with ChatGPT.

## How to Use

1. Create an OpenAI API key [here](https://platform.openai.com/account/api-keys), and then set the key as an action secret in your repository named `OPENAI_API_KEY`.

2. Create a file named `.github/workflows/openai-issue-reviewer.yml` in your repository with the following contents:

   ```yaml
   name: openai-issue-reviewer

   on:
     issues:
       types: [opened, edited, labeled]

   jobs:
     chatgpt-review:
       name: openai-issue-reviewer
       runs-on: ubuntu-latest
       steps:
         - uses: tomo-kn/openai-issue-reviewer@v1.0.0 # please use latest version
           name: openai-issue-reviewer
           with:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
             ISSUE_LANGUAGE: "ja-JP" # default: "en"
   ```

## Configurations

| Parameter        | Description                                   | Required | Default |
| ---------------- | --------------------------------------------- | -------- | ------- |
| `GITHUB_TOKEN`   | GitHub token used to send out review comments | True     | `""`    |
| `OPENAI_API_KEY` | API key used to invoke OpenAI                 | True     | `""`    |
| `ISSUE_LANGUAGE` | Language of the issue                         | False    | `"en"`  |
