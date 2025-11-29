import inquirer from 'inquirer';
import chalk from 'chalk';

export async function promptMenu() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Gitea Utils - Main Menu',
            choices: [
                { name: 'Repository Operations', value: 'repo' },
                { name: 'User Operations', value: 'user' },
                new inquirer.Separator(),
                { name: 'Exit', value: 'exit' }
            ]
        }
    ]);
    return action;
}

export async function promptRepoMenu() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Repository Management',
            choices: [
                { name: 'List Repositories', value: 'list' },
                { name: 'Create Repository', value: 'create' },
                { name: 'Delete Repository', value: 'delete' },
                new inquirer.Separator(),
                { name: 'Bulk Create Branch', value: 'bulk_branch' },
                { name: 'Bulk Create Milestone', value: 'bulk_milestone' },
                new inquirer.Separator(),
                { name: 'Back', value: 'back' }
            ]
        }
    ]);
    return action;
}

export async function promptUserMenu() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'User Management',
            choices: [
                { name: 'List Users', value: 'list' },
                { name: 'Add User', value: 'add' },
                new inquirer.Separator(),
                { name: 'Back', value: 'back' }
            ]
        }
    ]);
    return action;
}

export async function promptConfig() {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'url',
            message: 'Enter Gitea Base URL (e.g. https://git.example.com):',
            validate: input => input ? true : 'URL is required'
        },
        {
            type: 'password',
            name: 'token',
            message: 'Enter Gitea Personal Access Token:',
            mask: '*',
            validate: input => input ? true : 'Token is required'
        }
    ]);
}

export async function selectRepos(repos, message = 'Select Repositories') {
    if (repos.length === 0) {
        console.log(chalk.yellow('No repositories found.'));
        return [];
    }

    const { selected } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selected',
            message: message,
            choices: repos.map(r => ({ name: r.full_name, value: r })),
            pageSize: 15
        }
    ]);
    return selected;
}

export async function promptNewRepo() {
    return inquirer.prompt([
        { type: 'input', name: 'name', message: 'Repository Name:' },
        { type: 'input', name: 'description', message: 'Description:' },
        { type: 'confirm', name: 'isPrivate', message: 'Is Private?', default: true }
    ]);
}

export async function promptNewUser() {
    return inquirer.prompt([
        { type: 'input', name: 'username', message: 'Username:' },
        { type: 'input', name: 'email', message: 'Email:' },
        { type: 'password', name: 'password', message: 'Password:', mask: '*' }
    ]);
}

export async function promptNewBranch() {
    return inquirer.prompt([
        { type: 'input', name: 'newBranch', message: 'New Branch Name:' },
        { type: 'input', name: 'oldBranch', message: 'Base Branch (default: main):', default: 'main' }
    ]);
}

export async function promptNewMilestone() {
    return inquirer.prompt([
        { type: 'input', name: 'title', message: 'Milestone Title:' },
        { type: 'input', name: 'description', message: 'Description:' },
        { type: 'input', name: 'dueOn', message: 'Due Date (YYYY-MM-DD) [Optional]:' }
    ]);
}
