# Design: Gemini CLI Configuration Optimization

## 1. Architecture & Components

### 1.1 Configuration Hierarchy
The configuration will utilize the **Project Level** settings (`<project>/.gemini/settings.json`) to enforce team-wide standards. This file will be committed to the repository.

### 1.2 File Structure Changes
```
/
├── .gitignore                # Modified to un-ignore .gemini/settings.json
├── .gemini/
│   ├── settings.json         # NEW/UPDATED: Central configuration file
│   └── ... (other ignored files)
├── AGENTS.md                 # Existing core context
└── README-GEMINI-CLI.md      # Documentation for the new setup
```

## 2. Configuration Specification (`.gemini/settings.json`)

The JSON structure will adopt the namespace approach described in the reference guide.

### 2.1 General & UI
```json
{
  "general": {
    "previewFeatures": true,
    "enableAutoUpdate": true,
    "enablePromptCompletion": true,
    "retryFetchErrors": true
  },
  "ui": {
    "showStatusInTitle": true,
    "dynamicWindowTitle": true,
    "showMemoryUsage": true,
    "useAlternateBuffer": true,
    "incrementalRendering": true
  }
}
```

### 2.2 Model & Context
To ensure `AGENTS.md` is always read as the source of truth:
```json
{
  "contextFileName": ["AGENTS.md", "GEMINI.md"],
  "model": {
    "compressionThreshold": 0.5,
    "maxSessionTurns": 30,
    "summarizeToolOutput": true
  }
}
```
*Note: `thinking_level` is often controlled via runtime arguments or specific request configs, but if the CLI supports a default, it will be added.*

### 2.3 Security & Tools
Defining a safe baseline:
```json
{
  "security": {
    "disableYoloMode": true
  },
  "allowedTools": [
    "ls", "grep", "cat", "find", "pwd", "git status", "read_file"
  ],
  "fileFiltering": {
    "respectGitIgnore": true,
    "disableFuzzySearch": false
  }
}
```

## 3. Implementation Strategy

1.  **Gitignore Update**: Modify `.gitignore` to allow `.gemini/settings.json`.
2.  **Config Creation**: Create/Overwrite `.gemini/settings.json` with the JSON content.
3.  **Validation**: Since we cannot "run" the CLI against itself easily to verify internal state, we will verify by:
    - Checking the JSON syntax.
    - Documenting the expected behavior.
    - (Optional) Running a simple `gemini-cli --version` or help command if available to see if it complains about config errors (if the agent environment allows).

## 4. Test Strategy
- **Manual Verification**:
    - Inspect `.gitignore` rules using `git check-ignore`.
    - Validate JSON format.
- **Integration Check**:
    - Ensure future sessions pick up the `AGENTS.md` context automatically (implied by the setting).
