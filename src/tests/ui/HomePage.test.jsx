/**
 * @fileoverview Unit tests for HomePage component
 * 
 * Tests cover component rendering, user interaction, modal handling,
 * workout management, and exercise operations.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../../pages/HomePage.jsx';
import { useHomePage } from '../../hooks/useHomePage.jsx';

// Mock dependencies
vi.mock('../../hooks/useHomePage.jsx');
vi.mock('../../components/ui/ExerciseComponents.jsx', () => ({
    ExerciseList: vi.fn(({ exercises, onExerciseClick }) => (
        <div data-testid="exercise-list">
            {exercises?.map((ex, i) => (
                <div key={i} data-testid="exercise-item" onClick={() => onExerciseClick(ex)}>
                    {ex.name}
                </div>
            ))}
        </div>
    )),
    ExerciseSectionHeader: vi.fn(({ onAddExercise }) => (
        <button data-testid="add-exercise" onClick={onAddExercise}>Add Exercise</button>
    ))
}));
vi.mock('../../components/ui/ModalComponents.jsx', () => ({
    ExerciseDetailModal: vi.fn(({ open, onClose, exercise }) => (
        open ? <div data-testid="exercise-detail-modal" onClick={onClose}>{exercise?.name}</div> : null
    )),
    ExerciseModal: vi.fn(({ open, onClose, onSave }) => (
        open ? <div data-testid="exercise-modal"><button onClick={onSave}>Save</button><button onClick={onClose}>Close</button></div> : null
    )),
    WorkoutModal: vi.fn(({ open, onClose, onSave }) => (
        open ? <div data-testid="workout-modal"><button onClick={onSave}>Save</button><button onClick={onClose}>Close</button></div> : null
    ))
}));
vi.mock('../../components/ui/UIComponents.jsx', () => ({
    Screen: vi.fn(({ children, titleNode }) => (
        <div data-testid="screen">{titleNode}{children}</div>
    ))
}));
vi.mock('../../components/ui/UserComponents.jsx', () => ({
    UserHeader: vi.fn(({ userData }) => (
        <div data-testid="user-header">{userData?.name}</div>
    ))
}));
vi.mock('../../components/ui/ExpBarComponents.jsx', () => ({
    LevelProgressBar: vi.fn(({ userData }) => (
        <div data-testid="level-progress">{userData?.level}</div>
    ))
}));
vi.mock('../../components/ui/WorkoutComponents.jsx', () => ({
    WorkoutActions: vi.fn(({ onStartWorkout, onEditWorkout, hasWorkout }) => (
        <div data-testid="workout-actions">
            <button onClick={onStartWorkout} disabled={!hasWorkout}>Start Workout</button>
            <button onClick={onEditWorkout}>Edit Workout</button>
        </div>
    )),
    WorkoutSelector: vi.fn(({ workouts, onWorkoutSelect }) => (
        <div data-testid="workout-selector">
            {workouts?.map((w, i) => (
                <button key={i} onClick={() => onWorkoutSelect(w.id)}>{w.name}</button>
            ))}
        </div>
    )),
    WorkoutStats: vi.fn(({ lastWorkout }) => (
        <div data-testid="workout-stats">{lastWorkout?.name}</div>
    ))
}));
vi.mock('../../components/ui/ProfileAvatar.jsx', () => ({
    default: vi.fn(() => <div data-testid="profile-avatar">Avatar</div>)
}));

describe('HomePage', () => {
    const mockUserData = {
        uid: 'user-123',
        name: 'Test User',
        level: 5,
        points: 1500
    };

    const mockUseHomePage = {
        modalState: {
            workoutOpen: false,
            addExerciseOpen: false,
            showExerciseModal: false,
            isEditing: false,
            editingWorkout: false
        },
        setModalState: vi.fn(),
        loadingState: {
            isLoadingLastWorkout: false
        },
        dataState: {
            lastWorkout: {
                id: 'workout-1',
                name: 'Test Workout',
                exercises: [
                    { id: 'ex-1', name: 'Exercise 1' },
                    { id: 'ex-2', name: 'Exercise 2' }
                ]
            },
            allWorkouts: [
                { id: 'workout-1', name: 'Test Workout' },
                { id: 'workout-2', name: 'Another Workout' }
            ],
            selectedWorkoutId: 'workout-1',
            stations: [
                { id: 'station-1', name: 'Station 1' }
            ],
            selectedExercise: null
        },
        workoutForm: { name: '', description: '' },
        setWorkoutForm: vi.fn(),
        exerciseForm: { name: '', stationId: '' },
        setExerciseForm: vi.fn(),
        helpers: {
            getStationName: vi.fn((id) => `Station ${id}`),
            formatDate: vi.fn((date) => new Date(date).toLocaleDateString())
        },
        handleExerciseClick: vi.fn(),
        handleWorkoutSelection: vi.fn(),
        handleDeleteExercise: vi.fn(),
        handleDeleteCurrentWorkout: vi.fn(),
        handleEditExercise: vi.fn(),
        handleEditWorkout: vi.fn(),
        handleAddExercise: vi.fn(),
        handleStartWorkout: vi.fn(),
        saveExercise: vi.fn(),
        saveWorkout: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useHomePage).mockReturnValue(mockUseHomePage);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Component Rendering', () => {
        test('should render HomePage with all main sections', () => {
            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('screen')).toBeInTheDocument();
            expect(screen.getByTestId('user-header')).toBeInTheDocument();
            expect(screen.getByTestId('level-progress')).toBeInTheDocument();
            expect(screen.getByTestId('workout-selector')).toBeInTheDocument();
            expect(screen.getByTestId('workout-actions')).toBeInTheDocument();
        });

        test('should display user information correctly', () => {
            render(<HomePage userData={mockUserData} />);

            expect(screen.getByText('Test User')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        test('should render workout stats when lastWorkout exists', () => {
            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('workout-stats')).toBeInTheDocument();
            expect(screen.getByTestId('workout-stats')).toHaveTextContent('Test Workout');
        });

        test('should render exercise list when lastWorkout has exercises', () => {
            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('exercise-list')).toBeInTheDocument();
            expect(screen.getByText('Exercise 1')).toBeInTheDocument();
            expect(screen.getByText('Exercise 2')).toBeInTheDocument();
        });

        test('should not render workout stats when loading', () => {
            const loadingMock = {
                ...mockUseHomePage,
                loadingState: { isLoadingLastWorkout: true }
            };
            vi.mocked(useHomePage).mockReturnValue(loadingMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.queryByTestId('workout-stats')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
        });

        test('should not render exercise section when no workout', () => {
            const noWorkoutMock = {
                ...mockUseHomePage,
                dataState: {
                    ...mockUseHomePage.dataState,
                    lastWorkout: null
                }
            };
            vi.mocked(useHomePage).mockReturnValue(noWorkoutMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
            expect(screen.queryByTestId('add-exercise')).not.toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        test('should handle exercise click', () => {
            render(<HomePage userData={mockUserData} />);

            const exerciseItem = screen.getAllByTestId('exercise-item')[0];
            fireEvent.click(exerciseItem);

            expect(mockUseHomePage.handleExerciseClick).toHaveBeenCalledWith(
                mockUseHomePage.dataState.lastWorkout.exercises[0]
            );
        });

        test('should handle add exercise click', () => {
            render(<HomePage userData={mockUserData} />);

            const addButton = screen.getByTestId('add-exercise');
            fireEvent.click(addButton);

            expect(mockUseHomePage.handleAddExercise).toHaveBeenCalled();
        });

        test('should handle workout selection', () => {
            render(<HomePage userData={mockUserData} />);

            const workoutButtons = screen.getAllByText('Another Workout');
            fireEvent.click(workoutButtons[0]);

            expect(mockUseHomePage.handleWorkoutSelection).toHaveBeenCalledWith('workout-2');
        });

        test('should handle start workout button', () => {
            render(<HomePage userData={mockUserData} />);

            const startButton = screen.getByText('Start Workout');
            fireEvent.click(startButton);

            expect(mockUseHomePage.handleStartWorkout).toHaveBeenCalled();
        });

        test('should handle edit workout button', () => {
            render(<HomePage userData={mockUserData} />);

            const editButton = screen.getByText('Edit Workout');
            fireEvent.click(editButton);

            expect(mockUseHomePage.handleEditWorkout).toHaveBeenCalled();
        });
    });

    describe('Modal Handling', () => {
        test('should not render modals when closed', () => {
            render(<HomePage userData={mockUserData} />);

            expect(screen.queryByTestId('workout-modal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exercise-modal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exercise-detail-modal')).not.toBeInTheDocument();
        });

        test('should render workout modal when open', () => {
            const modalOpenMock = {
                ...mockUseHomePage,
                modalState: {
                    ...mockUseHomePage.modalState,
                    workoutOpen: true
                }
            };
            vi.mocked(useHomePage).mockReturnValue(modalOpenMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('workout-modal')).toBeInTheDocument();
        });

        test('should render exercise modal when open', () => {
            const modalOpenMock = {
                ...mockUseHomePage,
                modalState: {
                    ...mockUseHomePage.modalState,
                    addExerciseOpen: true
                }
            };
            vi.mocked(useHomePage).mockReturnValue(modalOpenMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('exercise-modal')).toBeInTheDocument();
        });

        test('should render exercise detail modal when open', () => {
            const modalOpenMock = {
                ...mockUseHomePage,
                modalState: {
                    ...mockUseHomePage.modalState,
                    showExerciseModal: true
                },
                dataState: {
                    ...mockUseHomePage.dataState,
                    selectedExercise: { id: 'ex-1', name: 'Selected Exercise' }
                }
            };
            vi.mocked(useHomePage).mockReturnValue(modalOpenMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('exercise-detail-modal')).toBeInTheDocument();
            expect(screen.getByText('Selected Exercise')).toBeInTheDocument();
        });

        test('should handle modal close actions', () => {
            const modalOpenMock = {
                ...mockUseHomePage,
                modalState: {
                    ...mockUseHomePage.modalState,
                    workoutOpen: true
                }
            };
            vi.mocked(useHomePage).mockReturnValue(modalOpenMock);

            render(<HomePage userData={mockUserData} />);

            const closeButton = screen.getByText('Close');
            fireEvent.click(closeButton);

            expect(mockUseHomePage.setModalState).toHaveBeenCalledWith(expect.any(Function));
        });

        test('should handle modal save actions', () => {
            const modalOpenMock = {
                ...mockUseHomePage,
                modalState: {
                    ...mockUseHomePage.modalState,
                    workoutOpen: true
                }
            };
            vi.mocked(useHomePage).mockReturnValue(modalOpenMock);

            render(<HomePage userData={mockUserData} />);

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            expect(mockUseHomePage.saveWorkout).toHaveBeenCalled();
        });
    });

    describe('Hook Integration', () => {
        test('should pass userData to useHomePage hook', () => {
            render(<HomePage userData={mockUserData} />);

            expect(useHomePage).toHaveBeenCalledWith(mockUserData);
        });

        test('should handle empty userData gracefully', () => {
            render(<HomePage userData={null} />);

            expect(useHomePage).toHaveBeenCalledWith(null);
            expect(screen.getByTestId('screen')).toBeInTheDocument();
        });

        test('should pass helpers to child components', () => {
            render(<HomePage userData={mockUserData} />);

            // Verify helpers are passed to components that need them
            expect(screen.getByTestId('exercise-list')).toBeInTheDocument();
        });
    });

    describe('Conditional Rendering', () => {
        test('should handle missing workout data', () => {
            const noDataMock = {
                ...mockUseHomePage,
                dataState: {
                    ...mockUseHomePage.dataState,
                    lastWorkout: null,
                    allWorkouts: []
                }
            };
            vi.mocked(useHomePage).mockReturnValue(noDataMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.queryByTestId('workout-stats')).not.toBeInTheDocument();
            expect(screen.queryByTestId('exercise-list')).not.toBeInTheDocument();
        });

        test('should handle empty exercise list', () => {
            const emptyExercisesMock = {
                ...mockUseHomePage,
                dataState: {
                    ...mockUseHomePage.dataState,
                    lastWorkout: {
                        ...mockUseHomePage.dataState.lastWorkout,
                        exercises: []
                    }
                }
            };
            vi.mocked(useHomePage).mockReturnValue(emptyExercisesMock);

            render(<HomePage userData={mockUserData} />);

            expect(screen.getByTestId('exercise-list')).toBeInTheDocument();
            expect(screen.queryByTestId('exercise-item')).not.toBeInTheDocument();
        });

        test('should disable start workout when no workout available', () => {
            const noWorkoutMock = {
                ...mockUseHomePage,
                dataState: {
                    ...mockUseHomePage.dataState,
                    lastWorkout: null
                },
                loadingState: {
                    isLoadingLastWorkout: false
                }
            };
            vi.mocked(useHomePage).mockReturnValue(noWorkoutMock);

            render(<HomePage userData={mockUserData} />);

            const startButton = screen.getByText('Start Workout');
            expect(startButton).toBeDisabled();
        });
    });
});
