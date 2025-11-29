import { jest } from '@jest/globals';

// Use unstable_mockModule to mock the 'conf' ES module
jest.unstable_mockModule('conf', () => ({
    default: jest.fn().mockImplementation(() => ({
        get: jest.fn((key) => {
            if (key === 'url') return 'http://stored.com';
            if (key === 'token') return 'stored-token';
            return null;
        }),
        set: jest.fn()
    }))
}));

// Mock fs and os for Tea Config
jest.unstable_mockModule('fs', () => ({
    default: {
        existsSync: jest.fn(),
        readFileSync: jest.fn()
    }
}));

jest.unstable_mockModule('os', () => ({
    default: {
        homedir: jest.fn(() => '/home/user')
    }
}));

// Import the module AFTER mocking
const { ConfigManager } = await import('../lib/config.js');

describe('ConfigManager', () => {
    let configManager;

    beforeEach(() => {
        // Clear env vars
        delete process.env.GITEA_URL;
        delete process.env.GITEA_TOKEN;
        jest.clearAllMocks();
        configManager = new ConfigManager();
    });

    test('getCredentials prefers Env Vars', () => {
        process.env.GITEA_URL = 'http://env.com';
        process.env.GITEA_TOKEN = 'env-token';

        const creds = configManager.getCredentials();
        expect(creds).toEqual({ url: 'http://env.com', token: 'env-token' });
    });

    test('getCredentials falls back to Config Store', () => {
        // Env vars are cleared in beforeEach
        // The mock Conf returns stored values
        const creds = configManager.getCredentials();
        expect(creds).toEqual({ url: 'http://stored.com', token: 'stored-token' });
    });

    test('saveCredentials stores values', () => {
        configManager.saveCredentials('http://new.com/', 'new-token');
        expect(configManager.conf.set).toHaveBeenCalledWith('url', 'http://new.com');
        expect(configManager.conf.set).toHaveBeenCalledWith('token', 'new-token');
    });
});
