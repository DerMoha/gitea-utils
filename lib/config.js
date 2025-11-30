import Conf from 'conf';
import path from 'path';
import fs from 'fs';
import os from 'os';
import yaml from 'js-yaml';

export class ConfigManager {
    constructor(projectName = 'gitea-utils') {
        this.conf = new Conf({ projectName });
    }

    getCredentials() {
        // 1. Env Vars
        let url = process.env.GITEA_URL;
        let token = process.env.GITEA_TOKEN;

        // 2. Config Store
        if (!url || !token) {
            url = url || this.conf.get('url');
            token = token || this.conf.get('token');
        }

        // 3. Tea CLI Config
        if (!url || !token) {
            const teaCreds = this._loadTeaConfig();
            if (teaCreds) {
                url = url || teaCreds.url;
                token = token || teaCreds.token;
            }
        }

        return { url: this._normalizeUrl(url), token };
    }

    saveCredentials(url, token) {
        const normalizedUrl = this._normalizeUrl(url);
        this.conf.set('url', normalizedUrl);
        this.conf.set('token', token);
    }

    getTheme() {
        return this.conf.get('theme') || 'dark';
    }

    saveTheme(themeName) {
        this.conf.set('theme', themeName);
    }

    getCustomTheme() {
        return this.conf.get('customTheme') || {
            primary: '#00ff00',
            secondary: '#ffffff',
            bg: '#000000',
            headerBg: '#005500',
            headerFg: '#ffffff',
            paneBg: '#000000',
            paneFg: '#ffffff',
            paneBorder: '#00ff00',
            inputBg: '#333333',
            inputFg: '#ffffff',
            listSelectedBg: '#00ff00',
            listSelectedFg: '#000000',
            buttonBg: '#00ff00',
            buttonFg: '#000000',
            buttonFocusBg: '#55ff55',
            logFg: '#00ff00',
            statusBg: '#111111',
            statusFg: '#ffffff'
        };
    }

    saveCustomTheme(themeObj) {
        this.conf.set('customTheme', themeObj);
    }

    _normalizeUrl(url) {
        return url ? url.replace(/\/$/, '') : '';
    }

    _loadTeaConfig() {
        try {
            const home = os.homedir();
            const pathsToCheck = [
                path.join(home, 'AppData', 'Roaming', 'tea', 'config.yml'), // Windows
                path.join(home, '.config', 'tea', 'config.yml'),            // XDG / Standard
                path.join(home, '.tea', 'config.yml')                       // Legacy / Fallback
            ];

            for (const p of pathsToCheck) {
                if (fs.existsSync(p)) {
                    const fileContents = fs.readFileSync(p, 'utf8');
                    const data = yaml.load(fileContents);
                    
                    if (data && data.logins && data.logins.length > 0) {
                        const login = data.logins.find(l => l.default) || data.logins[0];
                        return { url: login.url, token: login.token };
                    }
                }
            }
        } catch {
            // Ignore
        }
        return null;
    }
}
