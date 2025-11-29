# Gitea Utils

A CLI tool for managing your self-hosted Gitea instance. 

## Features

*   **Bulk Operations:** Create branches and milestones across multiple repositories simultaneously.
*   **Repo Management:** List, create, delete repositories.
*   **User Management:** List, create users.
*   **Seamless Auth:** Automatically detects credentials from the official `tea` CLI if installed.

## Installation

You can run this tool directly using `node`:

```bash
npm install
npm link
```

Now you can just run:

```bash
gtu
```

## Configuration

On first run, it will ask for your Gitea URL and Token. 
*   If you have `tea` installed and configured, it will try to import credentials automatically.
*   Config is stored in your system's config directory (handled by `conf`).