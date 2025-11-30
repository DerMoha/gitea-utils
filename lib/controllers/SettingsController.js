export class SettingsController {
    constructor(service, ui, logger, configManager, commandRegistry) {
        this.service = service;
        this.ui = ui;
        this.logger = logger;
        this.config = configManager;
        this.commandRegistry = commandRegistry;

        if (this.commandRegistry) {
            this.commandRegistry.register('settings', 'Open Settings', () => this.run());
        }
    }

    async run() {
        // Fetch current user for profile section
        let user = null;
        try {
            // Gitea API: /user (authenticated user)
            const res = await this.service.client.get('/user');
            user = res.data;
        } catch {
            this.logger.error('Failed to fetch user profile');
        }

        while (true) {
            const currentTheme = this.config.getTheme();
            const action = await this.ui.promptSettings(user, currentTheme);
            
            if (action === 'back') break;
            
            if (action === 'change_theme') {
                const newTheme = await this.ui.promptThemeSelection();
                if (newTheme) {
                    this.config.saveTheme(newTheme);
                    this.ui.setTheme(newTheme);
                }
                continue;
            }
        }
    }
}
