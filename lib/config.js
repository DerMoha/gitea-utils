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

    _normalizeUrl(url) {
        return url ? url.replace(/\/$/, '') : '';
    }

    _loadTeaConfig() {
        try {
            const teaPath = path.join(os.homedir(), 'AppData', 'Roaming', 'tea', 'config.yml');
            if (fs.existsSync(teaPath)) {
                const fileContents = fs.readFileSync(teaPath, 'utf8');
                const data = yaml.load(fileContents);
                
                if (data && data.logins && data.logins.length > 0) {
                    const login = data.logins.find(l => l.default) || data.logins[0];
                    return { url: login.url, token: login.token };
                }
            }
        } catch (e) {
            // Ignore
        }
        return null;
    }
}
