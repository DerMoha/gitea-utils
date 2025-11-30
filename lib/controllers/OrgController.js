import open from 'open';

export class OrgController {
    constructor(service, ui, logger) {
        this.service = service;
        this.ui = ui;
        this.logger = logger;
    }

    async run() {
        while (true) {
            const action = await this.ui.promptOrgMenu();
            if (action === 'back') break;

            try {
                await this.dispatch(action);
            } catch (err) {
                this.logger.error('Operation Failed:', err.response?.data?.message || err.message);
            }
            this.logger.log('');
        }
    }

    async dispatch(action) {
        switch (action) {
            case 'list':
                await this.listOrgs();
                break;
        }
    }

    async listOrgs() {
        try {
            this.ui.showLoading('Fetching organizations...');
            const orgs = await this.service.getOrgs();
            this.ui.hideLoading();

            await this.ui.showInteractiveList('Organizations', orgs, {
                columns: [
                    { header: 'Name', key: 'username', width: 20 },
                    { header: 'Full Name', key: 'full_name', width: 30 },
                    { header: 'Description', key: 'description', width: 40 }
                ],
                onSelect: async (org) => {
                    await this.handleOrgSelection(org);
                }
            });
        } catch (err) {
            this.logger.error(`Failed to list orgs: ${err.message}`);
            this.ui.hideLoading();
        }
    }

    async handleOrgSelection(org) {
        while (true) {
            const action = await this.ui.promptOrgDetailsMenu(org.username);
            
            if (action === 'back') {
                // Clear right pane to remove the details menu before going back to list
                // Actually listOrgs will redraw the list, so it's fine.
                return; 
            }

            if (action === 'browser') {
                try {
                   if (org.website) {
                       await open(org.website);
                       this.logger.success(`Opened ${org.website}`);
                   } else {
                       // Fallback to constructing URL if website is empty?
                       // Or assuming there is a dashboard. Usually Gitea orgs don't expose html_url in the same way as repos in all endpoints?
                       // Let's check common Gitea response. It usually has no html_url?
                       // Actually /user/orgs returns Organization which usually has no html_url field in older versions, but let's hope.
                       // If not, we can construct it from config URL + /orgname
                       // For now let's assume 'website' or log a warning.
                       this.logger.warn('No website URL found for organization.');
                   }
                } catch(e) {
                   this.logger.error(`Failed to open: ${e.message}`);
                }
            } else if (action === 'repos') {
                await this.listOrgRepos(org);
            } else if (action === 'members') {
                await this.listOrgMembers(org);
            }
        }
    }

    async listOrgRepos(org) {
        try {
            this.ui.showLoading(`Fetching repos for ${org.username}...`);
            const repos = await this.service.getOrgRepos(org.username);
            this.ui.hideLoading();
            
            await this.ui.showInteractiveList(`Repos: ${org.username}`, repos, {
                columns: [
                    { header: 'Name', key: 'name', width: 30 },
                    { header: 'Private', key: 'private', width: 10, renderer: v => v ? 'Yes' : 'No' },
                    { header: 'Description', key: 'description', width: 40 }
                ]
            });
        } catch(err) {
            this.logger.error(`Failed: ${err.message}`);
            this.ui.hideLoading();
        }
    }

    async listOrgMembers(org) {
        try {
            this.ui.showLoading(`Fetching members for ${org.username}...`);
            const members = await this.service.getOrgMembers(org.username);
            this.ui.hideLoading();

             await this.ui.showInteractiveList(`Members: ${org.username}`, members, {
                columns: [
                    { header: 'Username', key: 'login', width: 20 },
                    { header: 'Email', key: 'email', width: 30 },
                    { header: 'Full Name', key: 'full_name', width: 30 }
                ]
            });
        } catch(err) {
            this.logger.error(`Failed: ${err.message}`);
            this.ui.hideLoading();
        }
    }
}
