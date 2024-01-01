# openai-issue-reviewer

Automated issues reviewing with ChatGPT.

## How to Use

1. Create an OpenAI API key [here](https://platform.openai.com/account/api-keys), and then set the key as an action secret in your repository named `OPENAI_API_KEY`.

2. Create a file named `.github/workflows/openai-issue-reviewer.yml` in your repository with the following contents:

   ```yaml
   name: openai-issue-reviewer

   on:
     issues:
       types: [edited, labeled]

   jobs:
     openai-issue-reviewer:
       runs-on: ubuntu-latest
       steps:
         - uses: tomo-kn/openai-issue-reviewer@v1.0.0 # Please use latest version.
           name: openai-issue-reviewer
           with:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
             ISSUE_LANGUAGE: "ja-JP" # Set to your preferred language. Default is "en" (English).
   ```

## Features

- **Label Management**: If the labels "issue review 3.5" or "issue review 4" do not exist in your repository, they will be automatically created.
- **Model Selection**: Attach either "issue review 4" or "issue review 3.5" label to an issue to select the corresponding OpenAI model for reviewing.
- **Customized Review Points**: The review comments provided by ChatGPT are tailored based on the classified category of the issue.

## Configurations

| Parameter        | Description                                   | Required | Default |
| ---------------- | --------------------------------------------- | -------- | ------- |
| `GITHUB_TOKEN`   | GitHub token used to send out review comments | True     | `""`    |
| `OPENAI_API_KEY` | API key used to invoke OpenAI                 | True     | `""`    |
| `ISSUE_LANGUAGE` | Language of the issue                         | False    | `"en"`  |
