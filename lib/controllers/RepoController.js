import open from 'open';

export class RepoController {
    constructor(service, ui, logger, commandRegistry) {
        this.service = service;
        this.ui = ui;
        this.logger = logger;
        this.commandRegistry = commandRegistry;

        if (this.commandRegistry) {
            this.registerCommands();
        }
    }

    registerCommands() {
        this.commandRegistry.register('repo.list', 'List Repositories', () => this.listRepos());
        this.commandRegistry.register('repo.create', 'Create Repository', () => this.createRepo());
        this.commandRegistry.register('repo.delete', 'Delete Repository', () => this.deleteRepo());
        this.commandRegistry.register('repo.issues', 'Manage Issues', () => this.manageIssues());
        this.commandRegistry.register('repo.branch', 'Bulk Create Branch', () => this.bulkBranch());
        this.commandRegistry.register('repo.milestone', 'Bulk Create Milestone', () => this.bulkMilestone());
    }

    async run() {
        while (true) {
            const action = await this.ui.promptRepoMenu();
            if (action === 'back') break;

            try {
                await this.dispatch(action);
            } catch (err) {
                this.logger.error('Operation Failed:', err.message);
            }
            this.logger.log(''); // Spacer
        }
    }

    async dispatch(action) {
        switch (action) {
            case 'list':
                await this.listRepos();
                break;
            case 'create':
                await this.createRepo();
                break;
            case 'delete':
                await this.deleteRepo();
                break;
            case 'issues':
                await this.manageIssues();
                break;
            case 'bulk_branch':
                await this.bulkBranch();
                break;
            case 'bulk_milestone':
                await this.bulkMilestone();
                break;
        }
    }

    async manageIssues() {
        while (true) {
            const filter = await this.ui.promptIssueFilterMenu();
            if (filter === 'back') break;

            if (filter === 'create') {
                let repos = [];
                try {
                    this.ui.showLoading('Fetching repositories...');
                    repos = await this.service.getRepos();
                } finally {
                    this.ui.hideLoading();
                }

                const selected = await this.ui.selectRepos(repos, 'Select Repositories to Create Issue');
                if (selected.length > 0) {
                    await this.bulkCreateIssues(selected);
                }
                continue;
            }

            let issues = [];
            try {
                this.ui.showLoading('Fetching issues...');
                
                if (filter === 'repos') {
                    const repos = await this.service.getRepos();
                    this.ui.hideLoading(); // Hide briefly to show selection
                    const selected = await this.ui.selectRepos(repos, 'Select Repositories');
                    this.ui.showLoading('Fetching issues from selected repos...');
                    
                    for (const r of selected) {
                        const repoIssues = await this.service.getIssues(r.owner.login, r.name);
                        // Attach repo info if missing or ensure full name available
                        issues = issues.concat(repoIssues.map(i => ({ ...i, repository: r })));
                    }
                } else {
                    // generic search
                    const params = {};
                    if (filter === 'assigned') params.assigned = true;
                    if (filter === 'mentioned') params.mentioned = true;
                    // if 'all', params is empty {}
                    
                    issues = await this.service.searchIssues(params);
                }
            } catch (err) {
                this.logger.error(`Failed to fetch issues: ${err.message}`);
                this.ui.hideLoading();
                continue;
            } finally {
                this.ui.hideLoading();
            }

            // Group by Repository
            const grouped = {};
            issues.forEach(i => {
                const repoName = i.repository ? i.repository.full_name : 'Unknown Repository';
                if (!grouped[repoName]) grouped[repoName] = [];
                grouped[repoName].push(i);
            });

            // Flatten for display
            const listData = [];
            Object.keys(grouped).forEach(repoName => {
                // Header Item
                listData.push({ 
                    isHeader: true, 
                    title: `[${repoName}]`, 
                    state: '', 
                    user: null,
                    created_at: '' 
                });
                // Issue Items
                grouped[repoName].forEach(i => {
                    listData.push({
                        ...i,
                        isHeader: false,
                        displayTitle: `  #${i.number} ${i.title}`, // Indented
                        repoFullName: repoName
                    });
                });
            });

            await this.ui.showInteractiveList(`Issues (${filter})`, listData, {
                defaultSort: false,
                allowSort: false,
                columns: [
                    { header: 'Title/Repo', key: 'displayTitle', width: 50, renderer: (v, item) => item.isHeader ? item.title : v },
                    { header: 'State', key: 'state', width: 10 },
                    { header: 'User', key: 'user', width: 15, renderer: (u) => u ? u.login : '' }
                ],
                onSelect: async (item) => {
                    if (item.isHeader) return; // Ignore header clicks
                    
                    // We need repo owner/name for actions. 
                    // item.repository should exist from API or manual attachment
                    const repo = item.repository;
                    if (!repo) return;
                    
                    await this.handleIssueSelection(repo, item);
                }
            });
        }
    }

    async handleIssueSelection(repo, issue) {
        while (true) {
            const action = await this.ui.promptIssueActionMenu(issue.number);
            if (action === 'back') return;

            if (action === 'view') {
                await this.ui.showIssueDetails(issue);
            } else if (action === 'browser') {
                await open(issue.html_url);
            } else if (action === 'toggle') {
                const newState = issue.state === 'open' ? 'closed' : 'open';
                try {
                    await this.service.updateIssueState(repo.owner.login, repo.name, issue.number, newState);
                    this.logger.success(`Issue #${issue.number} is now ${newState}`);
                    issue.state = newState; 
                } catch (e) {
                    this.logger.error(`Failed to update issue: ${e.message}`);
                }
            }
        }
    }

    async createIssue(repo) {
        await this.bulkCreateIssues([repo]);
    }

    async bulkCreateIssues(repos) {
        const { title, body } = await this.ui.promptNewIssue();
        if (!title) return;

        this.ui.showLoading(`Creating issue in ${repos.length} repositories...`);
        try {
            for (const repo of repos) {
                try {
                    const issue = await this.service.createIssue(repo.owner.login, repo.name, title, body);
                    this.logger.success(`[${repo.full_name}] Issue #${issue.number} created`);
                } catch (err) {
                     this.logger.error(`[${repo.full_name}] Failed: ${err.message}`);
                }
            }
        } finally {
            this.ui.hideLoading();
        }
    }

    async listRepos() {
        try {
            this.ui.showLoading('Fetching repositories...');
            this.logger.info('Fetching repositories...');
            const repos = await this.service.getRepos();
            
            this.ui.hideLoading();
            await this.ui.showInteractiveList('Repositories', repos, {
                columns: [
                    { header: 'Name', key: 'full_name', width: 40 },
                    { header: 'Private', key: 'private', width: 10, renderer: (v) => v ? 'Yes' : 'No' },
                    { header: 'URL', key: 'html_url', width: 50 }
                ]
            });
        } catch (err) {
            this.logger.error(`Failed to list repos: ${err.message}`);
            this.ui.hideLoading();
        }
    }

    async createRepo() {
        const { name, description, isPrivate } = await this.ui.promptNewRepo();
        if (!name) return; // Handle cancellation if prompt returns null (optional)

        try {
            this.ui.showLoading('Creating repository...');
            const repo = await this.service.createRepo(name, description, isPrivate);
            this.logger.success(`Repository created: ${repo.full_name}`);
        } catch (err) {
             this.logger.error(`Failed to create repo: ${err.message}`);
        } finally {
            this.ui.hideLoading();
        }
    }

    async deleteRepo() {
        let repos = [];
        try {
            this.ui.showLoading('Fetching repositories...');
            this.logger.info('Fetching repositories...');
            repos = await this.service.getRepos();
        } finally {
            this.ui.hideLoading();
        }

        const selected = await this.ui.selectRepos(repos, 'Select Repositories to DELETE');
        if (selected.length > 0) {
            try {
                this.ui.showLoading('Deleting repositories...');
                for (const repo of selected) {
                    try {
                        await this.service.deleteRepo(repo.owner.login, repo.name);
                        this.logger.success(`Deleted ${repo.full_name}`);
                    } catch (err) {
                        this.logger.error(`Failed to delete ${repo.full_name}: ${err.message}`);
                    }
                }
            } finally {
                this.ui.hideLoading();
            }
        }
    }

    async bulkBranch() {
        let repos = [];
        try {
            this.ui.showLoading('Fetching repositories...');
            this.logger.info('Fetching repositories...');
            repos = await this.service.getRepos();
        } finally {
            this.ui.hideLoading();
        }

        const selected = await this.ui.selectRepos(repos, 'Select Repositories for New Branch');
        if (selected.length > 0) {
            const { newBranch, oldBranch } = await this.ui.promptNewBranch();
            try {
                this.ui.showLoading('Creating branches...');
                for (const repo of selected) {
                    try {
                        await this.service.createBranch(repo.owner.login, repo.name, newBranch, oldBranch);
                        this.logger.success(`Created branch '${newBranch}' in ${repo.full_name}`);
                    } catch (err) {
                        this.logger.error(`Failed in ${repo.full_name}: ${err.response?.data?.message || err.message}`);
                    }
                }
            } finally {
                this.ui.hideLoading();
            }
        }
    }

    async bulkMilestone() {
        let repos = [];
        try {
            this.ui.showLoading('Fetching repositories...');
            this.logger.info('Fetching repositories...');
            repos = await this.service.getRepos();
        } finally {
            this.ui.hideLoading();
        }

        const selected = await this.ui.selectRepos(repos, 'Select Repositories for New Milestone');
        if (selected.length > 0) {
            const { title, description, dueOn } = await this.ui.promptNewMilestone();
            try {
                this.ui.showLoading('Creating milestones...');
                for (const repo of selected) {
                    try {
                        await this.service.createMilestone(repo.owner.login, repo.name, title, description, dueOn ? new Date(dueOn).toISOString() : null);
                        this.logger.success(`Created milestone '${title}' in ${repo.full_name}`);
                    } catch (err) {
                        this.logger.error(`Failed in ${repo.full_name}: ${err.response?.data?.message || err.message}`);
                    }
                }
            } finally {
                this.ui.hideLoading();
            }
        }
    }
}
