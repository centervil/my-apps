# Security News Agent

This project is an AI agent that automatically collects the latest security news from various sources on the web, summarizes them, and generates a report in Markdown (and optionally PDF) format.

## How it works

The agent uses the following technologies:
- **Tavily:** To search for recent security articles.
- **LangChain & LangGraph:** To orchestrate the workflow of fetching, processing, and summarizing the news using an LLM.
- **Google Gemini:** As the Large Language Model for content generation and analysis.
- **Marp:** To format the final report as a presentation.

The agent performs the following steps:
1.  Collects security news from the last 24 hours.
2.  Generates an outline and table of contents.
3.  Writes the report content in Markdown.
4.  Evaluates the generated content.
5.  Saves the report and renders it to the desired format (e.g., PDF).

## Setup

1.  **Install dependencies:**
    ```bash
    cd apps/security-news-agent
    poetry install
    ```

2.  **Configure environment variables:**
    - Copy the `.env.example` file to `.env`.
    - Fill in the required API keys for LangSmith, Google Gemini, and Tavily.

## Usage

To run the agent, navigate to the agent's directory and use Poetry to execute the main script:

```bash
cd apps/security-news-agent
poetry run python src/security_news_agent/__main__.py
```

This will generate a new report in the `slides/` directory within the agent's folder.
