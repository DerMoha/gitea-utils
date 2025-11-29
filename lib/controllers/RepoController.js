export class RepoController {
    constructor(service, ui, logger) {
        this.service = service;
        this.ui = ui;
        this.logger = logger;
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
            case 'bulk_branch':
                await this.bulkBranch();
                break;
            case 'bulk_milestone':
                await this.bulkMilestone();
                break;
        }
    }

    async listRepos() {
        this.logger.info('Fetching repositories...');
        const repos = await this.service.getRepos();
        this.logger.table(repos.map(r => ({ Name: r.full_name, URL: r.html_url, Private: r.private })));
    }

    async createRepo() {
        const { name, description, isPrivate } = await this.ui.promptNewRepo();
        const repo = await this.service.createRepo(name, description, isPrivate);
        this.logger.success(`Repository created: ${repo.full_name}`);
    }

    async deleteRepo() {
        this.logger.info('Fetching repositories...');
        const repos = await this.service.getRepos();
        const selected = await this.ui.selectRepos(repos, 'Select Repositories to DELETE');
        if (selected.length > 0) {
            for (const repo of selected) {
                try {
                    await this.service.deleteRepo(repo.owner.login, repo.name);
                    this.logger.success(`Deleted ${repo.full_name}`);
                } catch (err) {
                    this.logger.error(`Failed to delete ${repo.full_name}: ${err.message}`);
                }
            }
        }
    }

    async bulkBranch() {
        this.logger.info('Fetching repositories...');
        const repos = await this.service.getRepos();
        const selected = await this.ui.selectRepos(repos, 'Select Repositories for New Branch');
        if (selected.length > 0) {
            const { newBranch, oldBranch } = await this.ui.promptNewBranch();
            for (const repo of selected) {
                try {
                    await this.service.createBranch(repo.owner.login, repo.name, newBranch, oldBranch);
                    this.logger.success(`Created branch '${newBranch}' in ${repo.full_name}`);
                } catch (err) {
                    this.logger.error(`Failed in ${repo.full_name}: ${err.response?.data?.message || err.message}`);
                }
            }
        }
    }

    async bulkMilestone() {
        this.logger.info('Fetching repositories...');
        const repos = await this.service.getRepos();
        const selected = await this.ui.selectRepos(repos, 'Select Repositories for New Milestone');
        if (selected.length > 0) {
            const { title, description, dueOn } = await this.ui.promptNewMilestone();
            for (const repo of selected) {
                try {
                    await this.service.createMilestone(repo.owner.login, repo.name, title, description, dueOn ? new Date(dueOn).toISOString() : null);
                    this.logger.success(`Created milestone '${title}' in ${repo.full_name}`);
                } catch (err) {
                    this.logger.error(`Failed in ${repo.full_name}: ${err.response?.data?.message || err.message}`);
                }
            }
        }
    }
}
