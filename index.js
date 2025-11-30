#!/usr/bin/env node
import chalk from 'chalk';
import * as ui from './lib/ui.js';
import { GiteaService } from './lib/api.js';
import { ConfigManager } from './lib/config.js';
import { RepoController } from './lib/controllers/RepoController.js';
import { UserController } from './lib/controllers/UserController.js';
import { OrgController } from './lib/controllers/OrgController.js';
import { SettingsController } from './lib/controllers/SettingsController.js';
import { Logger } from './lib/Logger.js';
import { CommandRegistry } from './lib/CommandRegistry.js';

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

    // Initialize Registry
    const commandRegistry = new CommandRegistry();

    // Initialize Theme
    const savedTheme = configManager.conf.get('theme', 'dark');
    ui.setTheme(savedTheme);
    
    // Pass registry to UI
    ui.setCommandRegistry(commandRegistry);

    const service = new GiteaService(url, token);
    const repoController = new RepoController(service, ui, logger, commandRegistry);
    const userController = new UserController(service, ui, logger, commandRegistry);
    const orgController = new OrgController(service, ui, logger, commandRegistry);
    const settingsController = new SettingsController(service, ui, logger, configManager, commandRegistry);

    // Register Global Commands
    commandRegistry.register('exit', 'Exit Application', () => process.exit(0));
    commandRegistry.register('dashboard', 'Show Dashboard', () => ui.showDashboard(currentUser, serverVersion));

    // Fetch initial data for dashboard
    let currentUser = null;
    let serverVersion = null;
    let stats = { repos: 0, orgs: 0, openIssues: 0, closedIssues: 0 };

    try {
        const [userRes, verRes, reposRes, orgsRes, openIssuesRes, closedIssuesRes] = await Promise.allSettled([
            service.client.get('/user'),
            service.client.get('/version'),
            service.getRepos(),
            service.getOrgs(),
            service.searchIssues({ state: 'open' }),
            service.searchIssues({ state: 'closed' })
        ]);
        
        if (userRes.status === 'fulfilled') currentUser = userRes.value.data;
        if (verRes.status === 'fulfilled') serverVersion = verRes.value.data;
        if (reposRes.status === 'fulfilled') stats.repos = reposRes.value.length;
        if (orgsRes.status === 'fulfilled') stats.orgs = orgsRes.value.length;
        if (openIssuesRes.status === 'fulfilled') stats.openIssues = openIssuesRes.value.length;
        if (closedIssuesRes.status === 'fulfilled') stats.closedIssues = closedIssuesRes.value.length;

    } catch {
        logger.warn('Failed to fetch initial dashboard data');
    }

    while (true) {
        ui.showDashboard(currentUser, serverVersion, stats);
        const action = await ui.promptMenu();
        if (action === 'exit') process.exit(0);

        if (action === 'repo') {
            await repoController.run();
        } else if (action === 'user') {
            await userController.run();
        } else if (action === 'org') {
            await orgController.run();
        } else if (action === 'settings') {
            await settingsController.run();
        }
    }
}

main();
