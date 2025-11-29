import { jest } from '@jest/globals';
import { RepoController } from '../../lib/controllers/RepoController.js';

describe('RepoController', () => {
    let mockService;
    let mockUI;
    let mockLogger;
    let controller;

    beforeEach(() => {
        mockService = {
            getRepos: jest.fn(),
            createRepo: jest.fn(),
            deleteRepo: jest.fn(),
            createBranch: jest.fn(),
            createMilestone: jest.fn()
        };
        mockUI = {
            promptRepoMenu: jest.fn(),
            promptNewRepo: jest.fn(),
            selectRepos: jest.fn(),
            promptNewBranch: jest.fn(),
            promptNewMilestone: jest.fn(),
            showLoading: jest.fn(),
            hideLoading: jest.fn(),
            showInteractiveList: jest.fn()
        };
        mockLogger = {
            log: jest.fn(),
            info: jest.fn(),
            success: jest.fn(),
            error: jest.fn(),
            table: jest.fn(),
            gray: jest.fn()
        };
        controller = new RepoController(mockService, mockUI, mockLogger);
    });

    test('listRepos fetches and displays repos', async () => {
        const repos = [{ full_name: 'test/repo', html_url: 'url', private: false }];
        mockService.getRepos.mockResolvedValue(repos);

        await controller.listRepos();

        expect(mockService.getRepos).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Fetching repositories...');
        expect(mockUI.showInteractiveList).toHaveBeenCalled();
    });

    test('createRepo prompts user and calls service', async () => {
        mockUI.promptNewRepo.mockResolvedValue({ name: 'new-repo', description: 'desc', isPrivate: true });
        mockService.createRepo.mockResolvedValue({ full_name: 'new-repo' });

        await controller.createRepo();

        expect(mockUI.promptNewRepo).toHaveBeenCalled();
        expect(mockService.createRepo).toHaveBeenCalledWith('new-repo', 'desc', true);
        expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('new-repo'));
    });

    test('deleteRepo prompts selection and deletes each', async () => {
        const repos = [{ owner: { login: 'u' }, name: 'r1', full_name: 'u/r1' }];
        mockService.getRepos.mockResolvedValue(repos);
        mockUI.selectRepos.mockResolvedValue(repos);

        await controller.deleteRepo();

        expect(mockService.deleteRepo).toHaveBeenCalledWith('u', 'r1');
        expect(mockLogger.success).toHaveBeenCalled();
    });

    test('deleteRepo handles errors gracefully', async () => {
        const repos = [{ owner: { login: 'u' }, name: 'r1', full_name: 'u/r1' }];
        mockService.getRepos.mockResolvedValue(repos);
        mockUI.selectRepos.mockResolvedValue(repos);
        mockService.deleteRepo.mockRejectedValue(new Error('Fail'));

        await controller.deleteRepo();

        expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete'));
    });
});
