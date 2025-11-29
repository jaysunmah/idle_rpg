---
enabled: true
title: Test and Deploy
description: Test and Deploy capabilities for the AI assistant
---

# Test and Deploy

## Description

This package enables the AI assistant to test and deploy applications using GitHub and Vercel MCP tools. When activated, the assistant should use the available GitHub MCP tools for repository management, pull requests, issues, and code reviews, and Vercel MCP tools for deployment, project management, and deployment monitoring. The assistant should proactively use these tools when users request testing, deployment, or GitHub-related operations without needing explicit permission to use the MCP tools.

## Examples

### Example 1: Deploy to Vercel
**User**: "Deploy this app to Vercel"
**Assistant**: The assistant should use the `mcp_user-vercel_deploy_to_vercel` tool to deploy the current project. If the project doesn't exist yet, it should check for existing projects using `mcp_user-vercel_list_projects` and create a new deployment. The assistant should monitor the deployment status and provide the deployment URL to the user.

### Example 2: Create Pull Request
**User**: "Create a PR for these changes"
**Assistant**: The assistant should use GitHub MCP tools to create a branch (`mcp_user-github_create_branch`), push the changes (`mcp_user-github_push_files`), and create a pull request (`mcp_user-github_create_pull_request`). The assistant should provide the PR URL and any relevant details about the changes.

### Example 3: Check Deployment Status
**User**: "What's the status of my latest deployment?"
**Assistant**: The assistant should use `mcp_user-vercel_list_deployments` to find the latest deployment, then use `mcp_user-vercel_get_deployment` to get detailed status information including build logs if needed.

## Usage Guidelines

- **When to use this package**: Activate when users request deployment, testing, GitHub operations (PRs, issues, branches), or Vercel-related tasks
- **What kinds of requests it handles**:
  - Deploying applications to Vercel
  - Creating and managing GitHub pull requests
  - Managing GitHub branches and commits
  - Checking deployment status and logs
  - Creating GitHub issues and managing them
  - Reviewing pull requests and code
  - Managing Vercel projects and domains
- **Tool usage**: The assistant should automatically use GitHub and Vercel MCP tools without asking for permission. Always use the appropriate MCP tool functions (prefixed with `mcp_user-github_` or `mcp_user-vercel_`) rather than suggesting manual steps.
- **Limitations**: Requires proper authentication and access to GitHub and Vercel accounts. The assistant should verify access before attempting operations.

## Configuration

- **GitHub MCP**: Requires GitHub authentication token configured in MCP settings
- **Vercel MCP**: Requires Vercel authentication token configured in MCP settings
- The assistant should check for `.vercel/project.json` to identify existing Vercel projects
- For GitHub operations, the assistant should identify the repository owner and name from the workspace context or git remote configuration
