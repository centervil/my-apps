# Tasks: Gemini CLI Optimization

- [ ] **Task 1: Git Configuration Update**
    - [ ] Edit `.gitignore` to remove `.gemini/settings.json` from ignored files (or add an exception `!config.json` if that's the name, plan assumes `settings.json`).
    - [ ] Verify with `git check-ignore -v .gemini/settings.json`.

- [ ] **Task 2: Project Settings Implementation**
    - [ ] Create `.gemini/settings.json`.
    - [ ] configure `general` and `ui` sections (Preview features, Alternate Buffer).
    - [ ] configure `contextFileName` to include `AGENTS.md`.
    - [ ] configure `security` settings (Disable YOLO, Whitelist tools).
    - [ ] configure `model` settings (Summarization, Compression).

- [ ] **Task 3: Documentation**
    - [ ] Create or Update `docs/gemini-cli-setup.md` (or `README-GEMINI-CLI.md`) with a section explaining the new configuration and its benefits.

- [ ] **Task 4: Verification & Cleanup**
    - [ ] Commit the changes.
    - [ ] Ensure no secrets are in `settings.json` (it should only contain config flags).
