import { jest } from '@jest/globals';
import { GiteaService } from '../lib/api.js';

describe('GiteaService', () => {
    let mockClient;
    let service;

    beforeEach(() => {
        mockClient = {
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn()
        };
        service = new GiteaService('http://test.com', 'token', mockClient);
    });

    test('getRepos handles pagination', async () => {
        // Mock first page (100 items - triggers next page)
        const page1 = Array(100).fill({ id: 1 });
        // Mock second page (10 items - stops)
        const page2 = Array(10).fill({ id: 2 });
        
        mockClient.get
            .mockResolvedValueOnce({ data: page1 })
            .mockResolvedValueOnce({ data: page2 });

        const repos = await service.getRepos();
        
        expect(repos.length).toBe(110);
        expect(mockClient.get).toHaveBeenCalledTimes(2);
        // Verify params
        expect(mockClient.get).toHaveBeenNthCalledWith(1, '/user/repos', expect.objectContaining({ params: { page: 1, limit: 100 } }));
        expect(mockClient.get).toHaveBeenNthCalledWith(2, '/user/repos', expect.objectContaining({ params: { page: 2, limit: 100 } }));
    });

    test('createRepo sends correct data', async () => {
        mockClient.post.mockResolvedValue({ data: { id: 1 } });
        await service.createRepo('test-repo', 'desc', true);
        expect(mockClient.post).toHaveBeenCalledWith('/user/repos', {
            name: 'test-repo',
            description: 'desc',
            private: true,
            auto_init: true
        });
    });

    test('deleteRepo calls delete endpoint', async () => {
        mockClient.delete.mockResolvedValue({});
        await service.deleteRepo('owner', 'repo');
        expect(mockClient.delete).toHaveBeenCalledWith('/repos/owner/repo');
    });

    test('getUsers calls admin endpoint', async () => {
        mockClient.get.mockResolvedValue({ data: [] });
        await service.getUsers();
        expect(mockClient.get).toHaveBeenCalledWith('/admin/users');
    });

    test('createUser sends correct data', async () => {
        mockClient.post.mockResolvedValue({ data: {} });
        await service.createUser('user', 'test@test.com', 'pass');
        expect(mockClient.post).toHaveBeenCalledWith('/admin/users', {
            login_name: 'user',
            username: 'user',
            email: 'test@test.com',
            password: 'pass',
            must_change_password: false
        });
    });

    test('createBranch sends correct data', async () => {
        mockClient.post.mockResolvedValue({ data: {} });
        await service.createBranch('owner', 'repo', 'feature', 'main');
        expect(mockClient.post).toHaveBeenCalledWith('/repos/owner/repo/branches', {
            new_branch_name: 'feature',
            old_branch_name: 'main'
        });
    });

    test('createMilestone sends correct data with dueOn', async () => {
        mockClient.post.mockResolvedValue({ data: {} });
        await service.createMilestone('owner', 'repo', 'v1', 'desc', '2023-01-01');
        expect(mockClient.post).toHaveBeenCalledWith('/repos/owner/repo/milestones', {
            title: 'v1',
            description: 'desc',
            due_on: '2023-01-01'
        });
    });
});