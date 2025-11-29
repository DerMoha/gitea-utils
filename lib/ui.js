import blessed from 'blessed';
import open from 'open';
import { ConfigManager } from './config.js';

const config = new ConfigManager();

let screen;
let headerBox;
let leftPane;
let rightPane;
let logBox;
let statusBar;
let statusText;
let statsText;

// Theme Definitions
const THEMES = {
    dark: {
        primary: '#6cc644', // Gitea Green
        secondary: 'white',
        bg: 'black',
        headerBg: '#6cc644',
        headerFg: 'white',
        paneBg: 'black',
        paneFg: 'white',
        paneBorder: '#6cc644',
        inputBg: '#333333',
        inputFg: 'white',
        listSelectedBg: '#6cc644',
        listSelectedFg: 'white',
        buttonBg: '#6cc644',
        buttonFg: 'white',
        buttonFocusBg: '#8edd6f',
        logFg: '#6cc644',
        statusBg: '#222222',
        statusFg: 'white'
    },
    light: {
        primary: '#6cc644',
        secondary: 'black',
        bg: 'white',
        headerBg: '#6cc644',
        headerFg: 'white',
        paneBg: 'white',
        paneFg: 'black',
        paneBorder: '#aaaaaa',
        inputBg: '#f0f0f0',
        inputFg: 'black',
        listSelectedBg: '#6cc644',
        listSelectedFg: 'white',
        buttonBg: '#6cc644',
        buttonFg: 'white',
        buttonFocusBg: '#4cae4c',
        logFg: 'black',
        statusBg: '#eeeeee',
        statusFg: 'black'
    },
    dracula: {
        primary: '#50fa7b',
        secondary: '#bd93f9',
        bg: '#282a36',
        headerBg: '#44475a',
        headerFg: '#f8f8f2',
        paneBg: '#282a36',
        paneFg: '#f8f8f2',
        paneBorder: '#6272a4',
        inputBg: '#44475a',
        inputFg: '#f8f8f2',
        listSelectedBg: '#bd93f9',
        listSelectedFg: '#282a36',
        buttonBg: '#50fa7b',
        buttonFg: '#282a36',
        buttonFocusBg: '#ff79c6',
        logFg: '#8be9fd',
        statusBg: '#44475a',
        statusFg: '#f8f8f2'
    },
    cyberpunk: {
        primary: '#fcee0a',
        secondary: '#ff00ff',
        bg: '#000b1e',
        headerBg: '#ff00ff',
        headerFg: 'black',
        paneBg: '#000b1e',
        paneFg: '#00f3ff',
        paneBorder: '#ff00ff',
        inputBg: '#051937',
        inputFg: '#fcee0a',
        listSelectedBg: '#fcee0a',
        listSelectedFg: 'black',
        buttonBg: '#00f3ff',
        buttonFg: 'black',
        buttonFocusBg: '#ff00ff',
        logFg: '#fcee0a',
        statusBg: '#051937',
        statusFg: '#00f3ff'
    },
    monokai: {
        primary: '#a6e22e',
        secondary: '#66d9ef',
        bg: '#272822',
        headerBg: '#272822',
        headerFg: '#f92672',
        paneBg: '#272822',
        paneFg: '#f8f8f2',
        paneBorder: '#66d9ef',
        inputBg: '#3e3d32',
        inputFg: '#f8f8f2',
        listSelectedBg: '#a6e22e',
        listSelectedFg: '#272822',
        buttonBg: '#66d9ef',
        buttonFg: '#272822',
        buttonFocusBg: '#fd971f',
        logFg: '#e6db74',
        statusBg: '#3e3d32',
        statusFg: '#f8f8f2'
    }
};

let currentThemeName = config.getTheme();
let THEME = THEMES[currentThemeName] || THEMES.dark;

export function setTheme(themeName) {
    if (THEMES[themeName]) {
        currentThemeName = themeName;
        THEME = THEMES[themeName];
        config.saveTheme(themeName);
        if (screen) {
            screen.destroy();
            screen = null;
            init();
        }
    }
}

function init() {
    if (screen) return;

    screen = blessed.screen({
        smartCSR: true,
        title: 'Gitea Utils',
        fullUnicode: true,
        autoPadding: true,
        style: { bg: THEME.bg, fg: THEME.paneFg }
    });

    // --- Layout ---

    // 1. Header (Top)
    headerBox = blessed.box({
        parent: screen,
        top: 0, left: 0, width: '100%', height: 1,
        content: '{center}{bold}GITEA UTILS CLI{/bold}{/center}',
        tags: true,
        style: { fg: THEME.headerFg, bg: THEME.headerBg }
    });

    // 2. Status Bar (Bottom)
    statusBar = blessed.box({
        parent: screen,
        bottom: 0, left: 0, width: '100%', height: 1,
        style: { fg: THEME.statusFg, bg: THEME.statusBg }
    });

    statusText = blessed.text({
        parent: statusBar,
        left: 1,
        content: 'Ready',
        style: { fg: THEME.statusFg, bg: THEME.statusBg }
    });

    statsText = blessed.text({
        parent: statusBar,
        right: 1,
        content: '',
        style: { fg: THEME.statusFg, bg: THEME.statusBg }
    });

    // 3. Logs (Bottom, above Status)
    logBox = blessed.log({
        parent: screen,
        bottom: 1, left: 0, width: '100%', height: '20%',
        border: { type: 'line' },
        label: ' Logs ',
        scrollable: true,
        scrollbar: { ch: ' ', style: { inverse: true } },
        style: { fg: THEME.logFg, bg: THEME.paneBg, border: { fg: THEME.paneBorder } }
    });

    // 4. Left Pane (Menu)
    leftPane = blessed.box({
        parent: screen,
        top: 1, left: 0, width: '30%', height: '80%-1', // 100% - Header(1) - Log(20%) - Status(1) ~= 80% ish
        border: { type: 'line' },
        label: ' Menu ',
        style: { fg: THEME.paneFg, bg: THEME.paneBg, border: { fg: THEME.paneBorder } }
    });

    // 5. Right Pane (Content)
    rightPane = blessed.box({
        parent: screen,
        top: 1, left: '30%', width: '70%', height: '80%-1',
        border: { type: 'line' },
        label: ' Context ',
        style: { fg: THEME.paneFg, bg: THEME.paneBg, border: { fg: THEME.paneBorder } }
    });

    screen.key(['C-c'], () => process.exit(0));
    
    screen.on('resize', () => {
        headerBox.emit('attach');
        leftPane.emit('attach');
        rightPane.emit('attach');
        logBox.emit('attach');
        statusBar.emit('attach');
    });

    screen.render();
}

export function log(msg) {
    if (!screen) init();
    if (logBox) {
        logBox.log(msg);
        screen.render();
    } else {
        console.log(msg);
    }
}

export function setStatus(msg) {
    if (statusText) {
        statusText.setContent(msg);
        screen.render();
    }
}

export function setStats(info) {
    if (statsText) {
        // info can be a string or object
        const content = typeof info === 'string' ? info : Object.entries(info).map(([k, v]) => `${k}: ${v}`).join(' | ');
        statsText.setContent(content);
        screen.render();
    }
}

// Helpers to clear panes
function clearLeft() {
    init();
    leftPane.children.forEach(c => { leftPane.remove(c); c.destroy(); });
    screen.render();
}

function clearRight() {
    init();
    rightPane.children.forEach(c => { rightPane.remove(c); c.destroy(); });
    screen.render();
}

// --- Menus (Left Pane) ---

function createMenu(title, items, values) {
    clearLeft();
    leftPane.setLabel(` ${title} `);
    
    return new Promise((resolve) => {
        const list = blessed.list({
            parent: leftPane,
            items: items,
            keys: true,
            mouse: true,
            vi: true,
            style: {
                bg: THEME.paneBg,
                fg: THEME.paneFg,
                selected: {
                    bg: THEME.listSelectedBg,
                    fg: THEME.listSelectedFg,
                    bold: true
                }
            }
        });

        list.on('select', (item, index) => {
            resolve(values[index]);
        });

        list.focus();
        screen.render();
    });
}

let loadingBox;
let loadingInterval;

const ASCII_LOGO = `
   ____ _ _               _   _ _   _ _     
  / ___(_) |_ ___  __ _  | | | | |_(_) |___ 
 | |  _| | __/ _ \\/ _\` | | | | | __| | / __|
 | |_| | | ||  __/ (_| | | |_| | |_| | \\__ \\
  \\____|_|\\__\\___|\\__,_|  \\___/ \\__|_|_|___/
`;

// ... (existing code)

export function showLoading(msg = 'Loading...') {
    if (loadingBox) return;

    const frames = ['|', '/', '-', '\\'];
    let i = 0;

    loadingBox = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '30%',
        height: 5,
        content: `\n {center}${msg}{/center}`,
        tags: true,
        border: { type: 'line' },
        style: { bg: THEME.paneBg, fg: THEME.paneFg, border: { fg: THEME.primary } },
        zIndex: 100
    });

    loadingInterval = setInterval(() => {
        loadingBox.setContent(`\n {center}${msg} ${frames[i++ % frames.length]}{/center}`);
        screen.render();
    }, 100);

    screen.render();
}

export function hideLoading() {
    if (loadingBox) {
        clearInterval(loadingInterval);
        loadingBox.destroy();
        loadingBox = null;
        screen.render();
    }
}

export function showDashboard(user, version) {
    clearRight();
    rightPane.setLabel(' Dashboard ');
    
    blessed.text({
        parent: rightPane,
        top: 1,
        left: 'center',
        content: ASCII_LOGO,
        style: { fg: THEME.primary }
    });

    const startRow = 8;
    
    if (user) {
        blessed.box({
            parent: rightPane,
            top: startRow, left: 'center', width: '50%', height: 7,
            label: ' User Info ',
            border: { type: 'line' },
            style: { border: { fg: THEME.secondary }, fg: THEME.paneFg }
        }).setContent(
            `\n Username: ${user.username || user.login}\n` +
            ` Email:    ${user.email || 'N/A'}\n` +
            ` Admin:    ${user.is_admin ? 'Yes' : 'No'}`
        );
    }

    if (version) {
        blessed.text({
            parent: rightPane,
            bottom: 1, right: 1,
            content: `Server Version: ${version.version}`,
            style: { fg: 'gray' }
        });
    }
    
    screen.render();
}

// ... (existing init and log functions) ...

export async function promptMenu() {
    setStatus('Main Menu');
    // Removed clearRight() and default text to preserve Dashboard
    
    return createMenu('Main Menu', 
        ['Repository Operations', 'User Operations', 'Settings', 'Exit'],
        ['repo', 'user', 'settings', 'exit']
    );
}

export async function promptRepoMenu() {
    setStatus('Repository Management');
    // We don't clear Right here immediately, or maybe we do?
    // Let's clear it to remove any stale forms.
    clearRight(); 
    blessed.text({ parent: rightPane, top: 'center', left: 'center', content: '{bold}Select a repository action.{/bold}', tags: true, style: { fg: 'gray' } });

    return createMenu('Repositories',
        ['List Repositories', 'Create Repository', 'Delete Repository', 'Bulk Create Branch', 'Bulk Create Milestone', 'Back'],
        ['list', 'create', 'delete', 'bulk_branch', 'bulk_milestone', 'back']
    );
}

export async function promptUserMenu() {
    setStatus('User Management');
    clearRight();
    blessed.text({ parent: rightPane, top: 'center', left: 'center', content: '{bold}Select a user action.{/bold}', tags: true, style: { fg: 'gray' } });

    return createMenu('Users',
        ['List Users', 'Add User', 'Back'],
        ['list', 'add', 'back']
    );
}

// --- Forms / Interactions (Right Pane) ---

export async function promptConfig() {
    clearRight();
    rightPane.setLabel(' Configuration ');
    setStatus('Configuration required');

    return new Promise((resolve) => {
        const form = blessed.form({
            parent: rightPane,
            keys: true,
            left: 0, top: 0, width: '100%', height: '100%',
            style: { bg: THEME.paneBg, fg: THEME.paneFg }
        });

        blessed.text({ parent: form, top: 1, left: 1, content: 'Gitea URL:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const urlInput = blessed.textbox({
            parent: form, top: 1, left: 15, height: 1, width: '50%',
            keys: true, mouse: true, inputOnFocus: true,
            style: { bg: THEME.inputBg, fg: THEME.inputFg, focus: { border: { fg: THEME.primary } } }
        });

        blessed.text({ parent: form, top: 3, left: 1, content: 'Token:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const tokenInput = blessed.textbox({
            parent: form, top: 3, left: 15, height: 1, width: '50%',
            keys: true, mouse: true, inputOnFocus: true, censor: true,
            style: { bg: THEME.inputBg, fg: THEME.inputFg, focus: { border: { fg: THEME.primary } } }
        });

        const submit = blessed.button({
            parent: form, top: 6, left: 1, shrink: true, padding: { left: 1, right: 1 },
            name: 'submit', content: 'Submit',
            style: { bg: THEME.buttonBg, fg: THEME.buttonFg, focus: { bg: THEME.buttonFocusBg } },
            keys: true, mouse: true
        });

        submit.on('press', () => form.submit());
        form.on('submit', () => resolve({ url: urlInput.value, token: tokenInput.value }));

        urlInput.focus();
        screen.render();
    });
}

export async function selectRepos(repos, message = 'Select Repositories') {
    clearRight();
    rightPane.setLabel(' Selection ');
    setStatus(message);

    if (repos.length === 0) {
        log('No repositories found.');
        return [];
    }

    return new Promise((resolve) => {
        const list = blessed.list({
            parent: rightPane,
            items: repos.map(r => `[ ] ${r.full_name}`),
            keys: true, mouse: true, vi: true,
            label: ` ${message} (x/Space select, Enter confirm) `,
            border: { type: 'line', fg: THEME.paneBorder },
            style: { 
                bg: THEME.paneBg, fg: THEME.paneFg,
                selected: { bg: THEME.listSelectedBg, fg: THEME.listSelectedFg } 
            }
        });

        const selectedIndices = new Set();

        list.on('keypress', (ch, key) => {
            if (key.name === 'x' || key.name === 'space') {
                const idx = list.selected;
                if (selectedIndices.has(idx)) {
                    selectedIndices.delete(idx);
                    list.setItem(idx, `[ ] ${repos[idx].full_name}`);
                } else {
                    selectedIndices.add(idx);
                    list.setItem(idx, `[*] ${repos[idx].full_name}`);
                }
                screen.render();
            } else if (key.name === 'enter') {
                 const result = [];
                 selectedIndices.forEach(i => result.push(repos[i]));
                 resolve(result);
            }
        });
        
        list.focus();
        screen.render();
    });
}

export async function promptNewRepo() {
    clearRight();
    rightPane.setLabel(' New Repository ');
    setStatus('Creating new repository...');

    return new Promise((resolve) => {
        const form = blessed.form({
            parent: rightPane, keys: true,
            left: 0, top: 0, width: '100%', height: '100%',
            style: { bg: THEME.paneBg, fg: THEME.paneFg }
        });
        
        let top = 1;
        blessed.text({ parent: form, top: top, left: 1, content: 'Name:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const nameIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        blessed.text({ parent: form, top: top, left: 1, content: 'Description:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const descIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        const privateCheck = blessed.checkbox({ parent: form, top: top, left: 1, content: 'Private?', checked: true, keys: true, mouse: true, style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        
        top+=2;
        const submit = blessed.button({ parent: form, top: top, left: 1, shrink: true, content: ' [ Submit ] ', style: { bg: THEME.buttonBg, fg: THEME.buttonFg, focus: { bg: THEME.buttonFocusBg } }, keys: true, mouse: true });
        
        submit.on('press', () => form.submit());
        form.on('submit', () => resolve({ name: nameIn.value, description: descIn.value, isPrivate: privateCheck.checked }));
        
        nameIn.focus();
        screen.render();
    });
}

export async function promptNewUser() {
    clearRight();
    rightPane.setLabel(' New User ');
    setStatus('Creating new user...');

    return new Promise((resolve) => {
        const form = blessed.form({
            parent: rightPane, keys: true,
            style: { bg: THEME.paneBg, fg: THEME.paneFg }
        });

        let top = 1;
        blessed.text({ parent: form, top: top, left: 1, content: 'Username:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const userIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        blessed.text({ parent: form, top: top, left: 1, content: 'Email:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const emailIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        blessed.text({ parent: form, top: top, left: 1, content: 'Password:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const passIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, censor: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        const submit = blessed.button({ parent: form, top: top, left: 1, shrink: true, content: ' [ Submit ] ', style: { bg: THEME.buttonBg, fg: THEME.buttonFg, focus: { bg: THEME.buttonFocusBg } }, keys: true, mouse: true });
        
        submit.on('press', () => form.submit());
        form.on('submit', () => resolve({ username: userIn.value, email: emailIn.value, password: passIn.value }));
        
        userIn.focus();
        screen.render();
    });
}

export async function promptNewBranch() {
    clearRight();
    rightPane.setLabel(' New Branch ');
    setStatus('Bulk creating branches...');

    return new Promise((resolve) => {
        const form = blessed.form({ parent: rightPane, keys: true, style: { bg: THEME.paneBg, fg: THEME.paneFg } });

        let top = 1;
        blessed.text({ parent: form, top: top, left: 1, content: 'New Branch Name:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const branchIn = blessed.textbox({ parent: form, top: top, left: 20, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        blessed.text({ parent: form, top: top, left: 1, content: 'Base Branch:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const baseIn = blessed.textbox({ parent: form, top: top, left: 20, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, value: 'main', style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        const submit = blessed.button({ parent: form, top: top, left: 1, shrink: true, content: ' [ Submit ] ', style: { bg: THEME.buttonBg, fg: THEME.buttonFg, focus: { bg: THEME.buttonFocusBg } }, keys: true, mouse: true });
        
        submit.on('press', () => form.submit());
        form.on('submit', () => resolve({ newBranch: branchIn.value, oldBranch: baseIn.value }));
        
        branchIn.focus();
        screen.render();
    });
}

export async function promptNewMilestone() {
    clearRight();
    rightPane.setLabel(' New Milestone ');
    setStatus('Bulk creating milestones...');

    return new Promise((resolve) => {
        const form = blessed.form({ parent: rightPane, keys: true, style: { bg: THEME.paneBg, fg: THEME.paneFg } });

        let top = 1;
        blessed.text({ parent: form, top: top, left: 1, content: 'Title:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const titleIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        blessed.text({ parent: form, top: top, left: 1, content: 'Description:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const descIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        blessed.text({ parent: form, top: top, left: 1, content: 'Due Date:', style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        const dateIn = blessed.textbox({ parent: form, top: top, left: 15, width: '50%', height: 1, keys: true, mouse: true, inputOnFocus: true, style: { bg: THEME.inputBg, fg: THEME.inputFg } });
        
        top+=2;
        const submit = blessed.button({ parent: form, top: top, left: 1, shrink: true, content: ' [ Submit ] ', style: { bg: THEME.buttonBg, fg: THEME.buttonFg, focus: { bg: THEME.buttonFocusBg } }, keys: true, mouse: true });
        
        submit.on('press', () => form.submit());
        form.on('submit', () => resolve({ title: titleIn.value, description: descIn.value, dueOn: dateIn.value }));
        
        titleIn.focus();
        screen.render();
    });
}

export async function promptThemeSelection() {
    clearRight();
    rightPane.setLabel(' Select Theme ');
    setStatus('Choose a theme...');

    const themes = Object.keys(THEMES);
    
    return new Promise((resolve) => {
        const list = blessed.list({
            parent: rightPane,
            items: themes,
            keys: true,
            mouse: true,
            vi: true,
            style: {
                bg: THEME.paneBg,
                fg: THEME.paneFg,
                selected: {
                    bg: THEME.listSelectedBg,
                    fg: THEME.listSelectedFg,
                    bold: true
                }
            }
        });

        list.on('select', (item, index) => {
            resolve(themes[index]);
        });

        list.focus();
        screen.render();
    });
}

export async function promptSettings(user, currentTheme) {
    clearRight();
    rightPane.setLabel(' Settings ');
    setStatus('Modifying settings...');

    return new Promise((resolve) => {
        const form = blessed.form({
            parent: rightPane, keys: true,
            style: { bg: THEME.paneBg, fg: THEME.paneFg }
        });

        let top = 1;
        blessed.text({ parent: form, top: top, left: 1, content: '{bold}User Profile:{/bold}', tags: true, style: { fg: THEME.primary, bg: THEME.paneBg } });
        top++;
        if (user) {
            blessed.text({ parent: form, top: top, left: 3, content: `Username: ${user.username || user.login}`, style: { bg: THEME.paneBg, fg: THEME.paneFg } });
            top++;
            blessed.text({ parent: form, top: top, left: 3, content: `Email: ${user.email}`, style: { bg: THEME.paneBg, fg: THEME.paneFg } });
            top++;
            blessed.text({ parent: form, top: top, left: 3, content: `Admin: ${user.is_admin ? 'Yes' : 'No'}`, style: { bg: THEME.paneBg, fg: THEME.paneFg } });
        } else {
            blessed.text({ parent: form, top: top, left: 3, content: 'User info unavailable', style: { fg: 'red', bg: THEME.paneBg } });
        }
        
        top += 2;
        blessed.text({ parent: form, top: top, left: 1, content: '{bold}Theme:{/bold}', tags: true, style: { fg: THEME.primary, bg: THEME.paneBg } });
        top++;
        
        blessed.text({ parent: form, top: top, left: 3, content: `Current Theme: ${currentTheme}`, style: { fg: THEME.paneFg, bg: THEME.paneBg } });
        top++;

        const themeBtn = blessed.button({
            parent: form, top: top, left: 3,
            content: ` [ Change Theme ] `,
            style: { bg: THEME.buttonBg, fg: THEME.buttonFg, focus: { bg: THEME.buttonFocusBg } },
            keys: true, mouse: true
        });

        themeBtn.on('press', () => resolve('change_theme'));
        
        top += 3;
        const backBtn = blessed.button({
            parent: form, top: top, left: 3,
            content: ' [ Back ] ',
            style: { bg: 'gray', fg: 'white', focus: { bg: 'red' } },
            keys: true, mouse: true
        });

        backBtn.on('press', () => resolve('back'));

        themeBtn.focus();
        screen.render();
    });
}

export async function showInteractiveList(title, items) {
    clearRight();
    rightPane.setLabel(` ${title} `);
    setStatus('Select to open in browser, ESC/q to back');

    if (items.length === 0) {
        blessed.text({
            parent: rightPane,
            top: 'center', left: 'center',
            content: 'No items to display.',
            style: { fg: 'yellow' }
        });
        
        // Wait for any key to go back
        return new Promise(resolve => {
            screen.onceKey(['escape', 'q', 'enter', 'space'], () => resolve());
            screen.render();
        });
    }

    return new Promise((resolve) => {
        const list = blessed.list({
            parent: rightPane,
            items: items.map(i => i.label),
            keys: true,
            mouse: true,
            vi: true,
            style: {
                bg: THEME.paneBg,
                fg: THEME.paneFg,
                selected: {
                    bg: THEME.listSelectedBg,
                    fg: THEME.listSelectedFg,
                    bold: true
                }
            },
            scrollbar: {
                ch: ' ',
                track: {
                    bg: THEME.paneBg
                },
                style: {
                    inverse: true
                }
            }
        });

        list.on('select', async (item, index) => {
            const selected = items[index];
            if (selected.value && selected.value.url) {
                try {
                    await open(selected.value.url);
                    setStatus(`Opened: ${selected.value.url}`);
                } catch (e) {
                    log(`Failed to open URL: ${e.message}`);
                }
            } else {
                setStatus(`Selected: ${selected.label}`);
            }
        });

        list.key(['escape', 'q', 'backspace'], () => {
            resolve();
        });

        list.focus();
        screen.render();
    });
}