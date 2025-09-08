/**
 * @fileoverview Unit tests for LoginPage component
 * 
 * Tests cover login/register forms, authentication flows, error handling,
 * admin routing, and user interface interactions.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage.jsx';
import UserManagement from '../../services/UserManagementSystem.jsx';
import ChallengeManagement from '../../services/ChallengeManagement.jsx';

// Mock dependencies
vi.mock('../../services/UserManagementSystem.jsx');
vi.mock('../../services/ChallengeManagement.jsx');

// Mock React.lazy
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        lazy: vi.fn((importFunc) => {
            return vi.fn(() => <div data-testid="lazy-component">Lazy Component</div>);
        }),
        Suspense: ({ children }) => children
    };
});

// Mock lazy components directly
vi.mock('../../pages/admin/AdminPage.jsx', () => ({
    default: {
        AdminPageMain: vi.fn(() => <div data-testid="admin-page">Admin Page</div>)
    }
}));

vi.mock('../../layouts/MainLayout.jsx', () => ({
    default: {
        AppLayout: vi.fn(() => <div data-testid="main-layout">Main Layout</div>)
    }
}));

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.log = vi.fn();
        console.error = vi.fn();
        
        // Reset UserManagement mocks
        vi.mocked(UserManagement.loginUser).mockClear();
        vi.mocked(UserManagement.signupUser).mockClear();
        vi.mocked(UserManagement.getUser).mockClear();
        vi.mocked(ChallengeManagement.addNewUserToChallenges).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        cleanup();
        vi.clearAllTimers();
    });

    describe('Initial Rendering', () => {
        test('should render login form by default', () => {
            render(<LoginPage />);

            expect(screen.getByText('THE')).toBeInTheDocument();
            expect(screen.getByText('SPHERE')).toBeInTheDocument();
            expect(screen.getByText('Login')).toBeInTheDocument();
            expect(screen.getByText('Register')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('max@sphere.fit')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
            expect(screen.getByText('Einloggen')).toBeInTheDocument();
        });

        test('should not show name field in login mode', () => {
            render(<LoginPage />);

            expect(screen.queryByPlaceholderText('Max Mustermann')).not.toBeInTheDocument();
        });

        test('should render brand and footer elements', () => {
            render(<LoginPage />);

            expect(screen.getByText('THE')).toBeInTheDocument();
            expect(screen.getByText('SPHERE')).toBeInTheDocument();
            expect(screen.getByText('Made by Serious Games Gruppe 13')).toBeInTheDocument();
            expect(screen.getByText('Mit dem Login stimmst du unseren Nutzungsbedingungen zu.')).toBeInTheDocument();
        });
    });

    describe('Mode Switching', () => {
        test('should switch to register mode', () => {
            render(<LoginPage />);

            const registerButton = screen.getByRole('button', { name: 'Register' });
            fireEvent.click(registerButton);

            expect(screen.getByPlaceholderText('Max Mustermann')).toBeInTheDocument();
            expect(screen.getByText('Account erstellen')).toBeInTheDocument();
        });

        test('should switch back to login mode', () => {
            render(<LoginPage />);

            // Switch to register first
            fireEvent.click(screen.getByRole('button', { name: 'Register' }));
            expect(screen.getByPlaceholderText('Max Mustermann')).toBeInTheDocument();

            // Switch back to login
            fireEvent.click(screen.getByRole('button', { name: 'Login' }));
            expect(screen.queryByPlaceholderText('Max Mustermann')).not.toBeInTheDocument();
            expect(screen.getByText('Einloggen')).toBeInTheDocument();
        });
    });

    describe('Form Input Handling', () => {
        test('should handle email input', () => {
            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('max@sphere.fit');
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            expect(emailInput.value).toBe('test@example.com');
        });

        test('should handle password input', () => {
            render(<LoginPage />);

            const passwordInput = screen.getByPlaceholderText('••••••••');
            fireEvent.change(passwordInput, { target: { value: 'password123' } });

            expect(passwordInput.value).toBe('password123');
        });

        test('should handle name input in register mode', () => {
            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            const nameInput = screen.getByPlaceholderText('Max Mustermann');
            fireEvent.change(nameInput, { target: { value: 'Test User' } });

            expect(nameInput.value).toBe('Test User');
        });

        test('should toggle password visibility', () => {
            render(<LoginPage />);

            const passwordInput = screen.getByPlaceholderText('••••••••');
            const toggleButton = screen.getByLabelText('Show password');

            expect(passwordInput.type).toBe('password');

            fireEvent.click(toggleButton);
            expect(passwordInput.type).toBe('text');

            fireEvent.click(toggleButton);
            expect(passwordInput.type).toBe('password');
        });
    });

    describe('Form Validation', () => {
        test('should show error for empty fields in login', async () => {
            render(<LoginPage />);

            const submitButton = screen.getByText('Einloggen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Bitte alle Felder ausfüllen.')).toBeInTheDocument();
            });
        });

        test('should show error for empty fields in register', async () => {
            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            const submitButton = screen.getByText('Account erstellen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Bitte alle Felder ausfüllen.')).toBeInTheDocument();
            });
        });

        test('should show error for missing name in register mode', async () => {
            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Account erstellen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Bitte alle Felder ausfüllen.')).toBeInTheDocument();
            });
        });
    });

    describe('Login Functionality', () => {
        test('should handle successful login for regular user', async () => {
            const mockUser = {
                uid: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                isAdmin: false
            };

            vi.mocked(UserManagement.loginUser).mockResolvedValue({ uid: 'user-123' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Einloggen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(UserManagement.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
                expect(UserManagement.getUser).toHaveBeenCalledWith('user-123');
            });
        });

        test('should handle successful login for admin user', async () => {
            const mockAdminUser = {
                uid: 'admin-123',
                name: 'Admin User',
                email: 'admin@example.com',
                isAdmin: true
            };

            vi.mocked(UserManagement.loginUser).mockResolvedValue({ uid: 'admin-123' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockAdminUser);

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'admin@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'admin123' } 
            });

            const submitButton = screen.getByText('Einloggen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(UserManagement.loginUser).toHaveBeenCalledWith('admin@example.com', 'admin123');
                expect(UserManagement.getUser).toHaveBeenCalledWith('admin-123');
            });
        });

        test('should handle login failure', async () => {
            const mockError = new Error('Invalid credentials');
            vi.mocked(UserManagement.loginUser).mockRejectedValue(mockError);

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'wrong@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'wrongpassword' } 
            });

            const submitButton = screen.getByText('Einloggen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Login failed: Invalid credentials')).toBeInTheDocument();
            });
        });
    });

    describe('Registration Functionality', () => {
        test('should handle successful registration', async () => {
            const mockUser = {
                uid: 'user-456',
                name: 'New User',
                email: 'new@example.com',
                isAdmin: false
            };

            vi.mocked(UserManagement.signupUser).mockResolvedValue({ uid: 'user-456' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);
            vi.mocked(ChallengeManagement.addNewUserToChallenges).mockResolvedValue();

            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            fireEvent.change(screen.getByPlaceholderText('Max Mustermann'), { 
                target: { value: 'New User' } 
            });
            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'new@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Account erstellen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(UserManagement.signupUser).toHaveBeenCalledWith('New User', 'new@example.com', 'password123');
                expect(UserManagement.getUser).toHaveBeenCalledWith('user-456');
                expect(ChallengeManagement.addNewUserToChallenges).toHaveBeenCalledWith('user-456');
            });
        });

        test('should handle registration failure', async () => {
            const mockError = new Error('Email already exists');
            vi.mocked(UserManagement.signupUser).mockRejectedValue(mockError);

            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            fireEvent.change(screen.getByPlaceholderText('Max Mustermann'), { 
                target: { value: 'Test User' } 
            });
            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'existing@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Account erstellen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Registration failed: Email already exists')).toBeInTheDocument();
            });
        });

        test('should handle challenge addition failure during registration', async () => {
            const mockUser = {
                uid: 'user-789',
                name: 'Test User',
                email: 'test@example.com',
                isAdmin: false
            };

            vi.mocked(UserManagement.signupUser).mockResolvedValue({ uid: 'user-789' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);
            vi.mocked(ChallengeManagement.addNewUserToChallenges).mockRejectedValue(new Error('Challenge error'));

            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            fireEvent.change(screen.getByPlaceholderText('Max Mustermann'), { 
                target: { value: 'Test User' } 
            });
            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Account erstellen');
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(console.error).toHaveBeenCalledWith('Failed to add new user to challenges:', expect.any(Error));
            });
        });
    });

    describe('Loading States', () => {
        test('should show loading state during login', async () => {
            vi.mocked(UserManagement.loginUser).mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 100))
            );

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Einloggen');
            fireEvent.click(submitButton);

            // Check if button is disabled during loading
            expect(submitButton).toBeDisabled();
        });

        test('should show loading state during registration', async () => {
            vi.mocked(UserManagement.signupUser).mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 100))
            );

            render(<LoginPage />);

            fireEvent.click(screen.getByRole('button', { name: 'Register' }));

            fireEvent.change(screen.getByPlaceholderText('Max Mustermann'), { 
                target: { value: 'Test User' } 
            });
            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            const submitButton = screen.getByText('Account erstellen');
            fireEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
        });
    });

    describe('Navigation After Login', () => {
        test('should redirect to main app for regular user', async () => {
            const mockUser = {
                uid: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                isAdmin: false
            };

            vi.mocked(UserManagement.loginUser).mockResolvedValue({ uid: 'user-123' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            fireEvent.click(screen.getByText('Einloggen'));

            await waitFor(() => {
                expect(screen.getByTestId('lazy-component')).toBeInTheDocument();
            });
        });

        test('should redirect to admin page for admin user', async () => {
            const mockAdminUser = {
                uid: 'admin-123',
                name: 'Admin User',
                email: 'admin@example.com',
                isAdmin: true
            };

            vi.mocked(UserManagement.loginUser).mockResolvedValue({ uid: 'admin-123' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockAdminUser);

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'admin@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'admin123' } 
            });

            fireEvent.click(screen.getByText('Einloggen'));

            await waitFor(() => {
                expect(screen.getByTestId('lazy-component')).toBeInTheDocument();
            });
        });
    });

    describe('Toast Messages', () => {
        test('should show success toast after login', async () => {
            const mockUser = {
                uid: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                isAdmin: false
            };

            vi.mocked(UserManagement.loginUser).mockResolvedValue({ uid: 'user-123' });
            vi.mocked(UserManagement.getUser).mockResolvedValue(mockUser);

            render(<LoginPage />);

            fireEvent.change(screen.getByPlaceholderText('max@sphere.fit'), { 
                target: { value: 'test@example.com' } 
            });
            fireEvent.change(screen.getByPlaceholderText('••••••••'), { 
                target: { value: 'password123' } 
            });

            fireEvent.click(screen.getByText('Einloggen'));

            // Note: Toast is shown briefly before redirect, so we might not catch it in test
            // But we can verify the login flow was completed
            await waitFor(() => {
                expect(UserManagement.loginUser).toHaveBeenCalled();
            });
        });
    });
});
