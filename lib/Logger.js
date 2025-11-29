import chalk from 'chalk';
import * as ui from './ui.js';

export class Logger {
    log(message) {
        ui.log(message);
    }

    info(message) {
        ui.log(chalk.blue(message));
    }

    success(message) {
        ui.log(chalk.green(message));
    }

    warn(message) {
        ui.log(chalk.yellow(message));
    }

    error(message, error = '') {
        ui.log(chalk.red(message) + (error ? ' ' + error : ''));
    }

    table(data) {
        if (Array.isArray(data) && data.length > 0) {
            // Simple string representation for the TUI log
            data.forEach(row => {
                ui.log(JSON.stringify(row));
            });
        }
    }

    gray(message) {
        ui.log(chalk.gray(message));
    }

    cyan(message) {
        ui.log(chalk.cyan(message));
    }
}
