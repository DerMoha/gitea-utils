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
            
            this.ui.hideLoading();
            await this.ui.showInteractiveList('Users', users, {
                columns: [
                    { header: 'Username', key: 'login', width: 20 },
                    { header: 'Email', key: 'email', width: 30 },
                    { header: 'Admin', key: 'is_admin', width: 10, renderer: (v) => v ? 'Yes' : 'No' }
                ]
            });
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
