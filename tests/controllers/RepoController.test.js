import { jest } from '@jest/globals';

jest.unstable_mockModule('open', () => ({
    default: jest.fn()
}));

const { RepoController } = await import('../../lib/controllers/RepoController.js');

describe('RepoController', () => {
    let mockService;
    let mockUI;
    let mockLogger;
    let controller;
    let mockRepo;

    beforeEach(() => {
        mockRepo = { full_name: 'owner/repo', name: 'repo', owner: { login: 'owner' } };
        mockService = {
            getRepos: jest.fn(),
            createRepo: jest.fn(),
            deleteRepo: jest.fn(),
            createBranch: jest.fn(),
            createMilestone: jest.fn(),
            getIssues: jest.fn(),
            createIssue: jest.fn(),
            updateIssueState: jest.fn(),
            searchIssues: jest.fn()
        };
        mockUI = {
            promptRepoMenu: jest.fn(),
            promptNewRepo: jest.fn(),
            selectRepos: jest.fn(),
            promptNewBranch: jest.fn(),
            promptNewMilestone: jest.fn(),
            promptIssueFilterMenu: jest.fn(),
            promptIssueActionMenu: jest.fn(),
            promptNewIssue: jest.fn(),
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
            gray: jest.fn(),
            warn: jest.fn()
        };
        controller = new RepoController(mockService, mockUI, mockLogger);
    });

    test('manageIssues flow with "all" filter fetches and lists', async () => {
        mockUI.promptIssueFilterMenu
            .mockResolvedValueOnce('all')
            .mockResolvedValueOnce('back');
        mockService.searchIssues.mockResolvedValue([{ title: 'Issue 1', repository: mockRepo }]);

        await controller.manageIssues();

        expect(mockUI.promptIssueFilterMenu).toHaveBeenCalled();
        expect(mockService.searchIssues).toHaveBeenCalledWith({});
        expect(mockUI.showInteractiveList).toHaveBeenCalled();
    });

    test('manageIssues flow with "repos" filter selects and lists', async () => {
        mockUI.promptIssueFilterMenu
            .mockResolvedValueOnce('repos')
            .mockResolvedValueOnce('back');
        mockService.getRepos.mockResolvedValue([mockRepo]);
        mockUI.selectRepos.mockResolvedValue([mockRepo]);
        mockService.getIssues.mockResolvedValue([{ title: 'Issue 1' }]);

        await controller.manageIssues();

        expect(mockUI.selectRepos).toHaveBeenCalled();
        expect(mockService.getIssues).toHaveBeenCalledWith('owner', 'repo');
        expect(mockUI.showInteractiveList).toHaveBeenCalled();
    });

    test('manageIssues flow with "create" filter prompts creation', async () => {
        mockUI.promptIssueFilterMenu
            .mockResolvedValueOnce('create')
            .mockResolvedValueOnce('back');
        mockService.getRepos.mockResolvedValue([mockRepo]);
        mockUI.selectRepos.mockResolvedValue([mockRepo]);
        mockUI.promptNewIssue.mockResolvedValue({ title: 'T', body: 'B' });
        mockService.createIssue.mockResolvedValue({ number: 1 });

        await controller.manageIssues();

        expect(mockUI.selectRepos).toHaveBeenCalled();
        expect(mockService.createIssue).toHaveBeenCalled();
    });

    test('createIssue prompts and calls service', async () => {
        mockUI.promptNewIssue.mockResolvedValue({ title: 'Bug', body: 'Fix it' });
        mockService.createIssue.mockResolvedValue({ number: 1, title: 'Bug' });

        await controller.createIssue(mockRepo);

        expect(mockService.createIssue).toHaveBeenCalledWith('owner', 'repo', 'Bug', 'Fix it');
        expect(mockLogger.success).toHaveBeenCalled();
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
