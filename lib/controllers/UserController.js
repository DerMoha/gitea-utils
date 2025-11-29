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
        const users = await this.service.getUsers();
        this.logger.table(users.map(u => ({ ID: u.id, Username: u.login, Email: u.email, Admin: u.is_admin })));
    }

    async addUser() {
        const { username, email, password } = await this.ui.promptNewUser();
        await this.service.createUser(username, email, password);
        this.logger.success(`User ${username} created.`);
    }
}
