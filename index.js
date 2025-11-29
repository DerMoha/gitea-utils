#!/usr/bin/env node
import chalk from 'chalk';
import * as ui from './lib/ui.js';
import { GiteaService } from './lib/api.js';
import { ConfigManager } from './lib/config.js';
import { RepoController } from './lib/controllers/RepoController.js';
import { UserController } from './lib/controllers/UserController.js';
import { Logger } from './lib/Logger.js';

async function main() {
    const logger = new Logger();
    logger.cyan(chalk.bold('Welcome to Gitea Utils (Node.js Edition)'));

    const configManager = new ConfigManager();
    let { url, token } = configManager.getCredentials();

    if (!url || !token) {
        logger.warn('Configuration missing. Please provide details.');
        const answers = await ui.promptConfig();
        url = answers.url;
        token = answers.token;
        configManager.saveCredentials(url, token);
    }
    
    logger.gray(`Connected to: ${url}`);

    const service = new GiteaService(url, token);
    const repoController = new RepoController(service, ui, logger);
    const userController = new UserController(service, ui, logger);

    while (true) {
        const action = await ui.promptMenu();
        if (action === 'exit') process.exit(0);

        if (action === 'repo') {
            await repoController.run();
        } else if (action === 'user') {
            await userController.run();
        }
    }
}

main();
