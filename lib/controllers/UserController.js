export class UserController {
    constructor(service, ui, logger) {
        this.service = service;
        this.ui = ui;
        this.logger = logger;
    }

    async run() {
        while (true) {
            const action = await this.ui.promptUserMenu();
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
                await this.listUsers();
                break;
            case 'add':
                await this.addUser();
                break;
        }
    }

    async listUsers() {
        try {
            this.ui.showLoading('Fetching users...');
            const users = await this.service.getUsers();
            
            const listItems = users.map(u => ({
                label: `${u.login} <${u.email}> ${u.is_admin ? '(Admin)' : ''}`,
                value: { url: u.html_url } // Assuming html_url exists
            }));

            this.ui.hideLoading();
            await this.ui.showInteractiveList('Users', listItems);
        } catch (err) {
            this.logger.error(`Failed to list users: ${err.message}`);
            this.ui.hideLoading();
        }
    }

    async addUser() {
        const { username, email, password } = await this.ui.promptNewUser();
        await this.service.createUser(username, email, password);
        this.logger.success(`User ${username} created.`);
    }
}
