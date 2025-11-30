import { jest } from '@jest/globals';

// Mock open
jest.unstable_mockModule('open', () => ({
    default: jest.fn()
}));

const { OrgController } = await import('../../lib/controllers/OrgController.js');
const { default: mockOpen } = await import('open');

describe('OrgController', () => {
    let mockService;
    let mockUI;
    let mockLogger;
    let controller;

    beforeEach(() => {
        mockService = {
            getOrgs: jest.fn(),
            getOrgRepos: jest.fn(),
            getOrgMembers: jest.fn()
        };
        mockUI = {
            promptOrgMenu: jest.fn(),
            promptOrgDetailsMenu: jest.fn(),
            showInteractiveList: jest.fn(),
            showLoading: jest.fn(),
            hideLoading: jest.fn()
        };
        mockLogger = {
            log: jest.fn(),
            success: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        };
        controller = new OrgController(mockService, mockUI, mockLogger);
    });

    test('listOrgs fetches and displays orgs', async () => {
        const orgs = [{ username: 'myorg' }];
        mockService.getOrgs.mockResolvedValue(orgs);

        await controller.listOrgs();

        expect(mockService.getOrgs).toHaveBeenCalled();
        expect(mockUI.showInteractiveList).toHaveBeenCalledWith('Organizations', orgs, expect.any(Object));
    });

    test('listOrgRepos fetches and displays repos', async () => {
        const org = { username: 'myorg' };
        const repos = [{ name: 'repo1' }];
        mockService.getOrgRepos.mockResolvedValue(repos);

        await controller.listOrgRepos(org);

        expect(mockService.getOrgRepos).toHaveBeenCalledWith('myorg');
        expect(mockUI.showInteractiveList).toHaveBeenCalledWith(expect.stringContaining('Repos: myorg'), repos, expect.any(Object));
    });

    test('listOrgMembers fetches and displays members', async () => {
        const org = { username: 'myorg' };
        const members = [{ login: 'user1' }];
        mockService.getOrgMembers.mockResolvedValue(members);

        await controller.listOrgMembers(org);

        expect(mockService.getOrgMembers).toHaveBeenCalledWith('myorg');
        expect(mockUI.showInteractiveList).toHaveBeenCalledWith(expect.stringContaining('Members: myorg'), members, expect.any(Object));
    });

    test('handleOrgSelection opens browser', async () => {
        const org = { username: 'myorg', website: 'https://example.com' };
        // First call returns 'browser', second 'back' to exit loop
        mockUI.promptOrgDetailsMenu
            .mockResolvedValueOnce('browser')
            .mockResolvedValueOnce('back');
        
        await controller.handleOrgSelection(org);

        expect(mockOpen).toHaveBeenCalledWith('https://example.com');
        expect(mockLogger.success).toHaveBeenCalled();
    });
});
