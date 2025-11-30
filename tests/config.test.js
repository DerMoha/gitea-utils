import { jest } from '@jest/globals';

let mockStore = {
    url: 'http://stored.com',
    token: 'stored-token'
};

// Use unstable_mockModule to mock the 'conf' ES module
jest.unstable_mockModule('conf', () => ({
    default: jest.fn().mockImplementation(() => ({
        get: jest.fn((key) => mockStore[key]),
        set: jest.fn((k, v) => { mockStore[k] = v; })
    }))
}));

// Mock fs and os for Tea Config
let mockFs = {
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn()
};

jest.unstable_mockModule('fs', () => ({
    default: mockFs
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
        mockStore = { url: 'http://stored.com', token: 'stored-token' };
        mockFs.existsSync.mockReturnValue(false); // Reset fs mock
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

    test('getCredentials falls back to Tea Config (Standard Path)', () => {
        mockStore = {}; // Clear store
        
        // Mock FS to find tea config in standard .config location
        mockFs.existsSync.mockImplementation((p) => p.includes('.config') && p.includes('tea'));
        mockFs.readFileSync.mockReturnValue(`
logins:
  - name: gitea
    url: http://tea.com
    token: tea-token
    default: true
`);
        
        const creds = configManager.getCredentials();
        expect(creds).toEqual({ url: 'http://tea.com', token: 'tea-token' });
    });

    test('getCredentials falls back to Tea Config (Windows Path)', () => {
        mockStore = {}; 
        
        // Mock FS to find tea config in AppData
        mockFs.existsSync.mockImplementation((p) => p.includes('AppData') && p.includes('tea'));
        mockFs.readFileSync.mockReturnValue(`
logins:
  - name: gitea
    url: http://tea-win.com
    token: tea-token-win
    default: true
`);
        
        const creds = configManager.getCredentials();
        expect(creds).toEqual({ url: 'http://tea-win.com', token: 'tea-token-win' });
    });

    test('saveCredentials stores values', () => {
        configManager.saveCredentials('http://new.com/', 'new-token');
        expect(mockStore['url']).toBe('http://new.com');
        expect(mockStore['token']).toBe('new-token');
    });
});