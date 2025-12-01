export class CommandRegistry {
    constructor() {
        this.commands = new Map();
    }

    register(name, description, handler) {
        if (!name || typeof handler !== 'function') {
            throw new Error('Invalid command registration');
        }

        this.commands.set(name, {
            name,
            description: description || name,
            handler
        });
    }

    unregister(name) {
        this.commands.delete(name);
    }

    getCommands() {
        return Array.from(this.commands.values());
    }

    async execute(name, ...args) {
        const cmd = this.commands.get(name);
        if (!cmd) {
            throw new Error(`Command not found: ${name}`);
        }
        return cmd.handler(...args);
    }
}
