import chalk from 'chalk';

export class Logger {
    log(message) {
        console.log(message);
    }

    info(message) {
        console.log(chalk.blue(message));
    }

    success(message) {
        console.log(chalk.green(message));
    }

    warn(message) {
        console.log(chalk.yellow(message));
    }

    error(message, error = '') {
        console.error(chalk.red(message), error);
    }

    table(data) {
        console.table(data);
    }

    gray(message) {
        console.log(chalk.gray(message));
    }

    cyan(message) {
        console.log(chalk.cyan(message));
    }
}
