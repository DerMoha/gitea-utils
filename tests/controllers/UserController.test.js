import { jest } from '@jest/globals';
import { UserController } from '../../lib/controllers/UserController.js';

describe('UserController', () => {
    let mockService;
    let mockUI;
    let mockLogger;
    let controller;

    beforeEach(() => {
        mockService = {
            getUsers: jest.fn(),
            createUser: jest.fn()
        };
        mockUI = {
            promptUserMenu: jest.fn(),
            promptNewUser: jest.fn()
        };
        mockLogger = {
            log: jest.fn(),
            table: jest.fn(),
            success: jest.fn(),
            error: jest.fn()
        };
        controller = new UserController(mockService, mockUI, mockLogger);
    });

    test('listUsers fetches and displays users', async () => {
        mockService.getUsers.mockResolvedValue([{ id: 1, login: 'admin', email: 'a@a.com', is_admin: true }]);

        await controller.listUsers();

        expect(mockService.getUsers).toHaveBeenCalled();
        expect(mockLogger.table).toHaveBeenCalled();
    });

    test('addUser prompts and calls service', async () => {
        mockUI.promptNewUser.mockResolvedValue({ username: 'u', email: 'e', password: 'p' });
        
        await controller.addUser();

        expect(mockService.createUser).toHaveBeenCalledWith('u', 'e', 'p');
        expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('User u created'));
    });
});
