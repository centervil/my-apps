# Design for Issue #56: Organize gemini-cli actions

## 1. Overview
This document outlines the technical design to address Issue #56. The plan involves two main parts: deleting obsolete GitHub Action workflow files and modifying the remaining workflows to ensure responses are in Japanese.

## 2. Workflow File Deletion

Based on the issue description and an analysis of the `.github/workflows/` directory, the following files have been identified for deletion:

- **`.github/workflows/gemini-invoke.yml`**: The `invoke` feature is reported as non-functional.
- **`.github/workflows/gemini-triage.yml`**: The `triage` feature is deemed unnecessary.
- **`.github/workflows/test-gemini-workflows.yml`**: Per-commit testing of workflows is considered excessive.
- **`.github/workflows/e2e-test-gemini.yml`**: Same as above, end-to-end testing of the agent workflows on every commit is not required.

These files will be removed using the `delete_file` tool. No other files seem to be dependent on these workflows, so the impact of their removal should be isolated.

## 3. Japanese Language Implementation

The requirement is to make the agent respond in Japanese by default. This will be achieved by modifying the prompts sent to the language model.

### 3.1. Investigation
The primary workflows for agent interaction are `gemini-dispatch.yml` and `gemini-review.yml`. I will analyze these files to locate where the prompt is constructed. The goal is to find the step that calls the `gh` CLI or a script that prepares the prompt for the Gemini agent.

### 3.2. Implementation Strategy
The most direct approach is to append a language instruction to the prompt. A phrase like `応答は日本語でお願いします。` (Please respond in Japanese.) will be added to the end of the main prompt body.

- **Target Files**: The modification will likely be in `gemini-dispatch.yml` and `gemini-review.yml`.
- **Modification**: A `sed` command or the `replace_with_git_merge_diff` tool will be used to insert the language instruction into the prompt construction logic within the YAML files. The exact implementation will depend on the structure of the files. I will look for a variable or step that defines the prompt content.

## 4. Verification Plan
- **Deletion**: After deleting the files, I will use `ls -R .github/workflows` to confirm they are gone.
- **Language Change**: After modifying the workflow files, I will use `read_file` to inspect them and confirm the Japanese language instruction has been added correctly. Since running the workflow requires triggering it via a GitHub event, manual verification of the change in the file will be the primary method.
