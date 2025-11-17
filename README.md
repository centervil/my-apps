# my-apps Repository

This repository contains scripts and tools used for generating documentation.

The scripts in this repository are designed to be portable and are executed by a GitHub Actions workflow in the `centervil/my-docs` repository. This repository acts as a "toolbox" and does not have any special permissions or awareness of the `my-docs` repository.

## Scripts

-   `tools/doc-generator/note_post.py`: A Python script that uses the `oasis` library to post Markdown files to Note.com.

For more information on the overall documentation generation process, please refer to the `centervil/my-docs` repository.