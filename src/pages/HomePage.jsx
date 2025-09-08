/**
 * @fileoverview HomePage Component
 * 
 * Main dashboard component for the fitness application. Displays user profile,
 * workout information, exercise management, and provides navigation to other features.
 * 
 * This component has been refactored to use modular components and a custom hook
 * for improved maintainability and reusability.
 * 
 * @module HomePage
 * @author Team
 * @version 2.0.0
 */

import { ExerciseList, ExerciseSectionHeader } from '../components/ui/ExerciseComponents.jsx';
import { ExerciseDetailModal, ExerciseModal, WorkoutModal } from '../components/ui/ModalComponents.jsx';
import { Screen } from '../components/ui/UIComponents.jsx';
import { UserHeader } from '../components/ui/UserComponents.jsx';
import { LevelProgressBar } from '../components/ui/ExpBarComponents.jsx';
import { WorkoutActions, WorkoutSelector, WorkoutStats } from '../components/ui/WorkoutComponents.jsx';
import { useHomePage } from '../hooks/useHomePage.jsx';
import '../components/styles/sphere-styles.css';

/**
 * Main HomePage component with user dashboard and workout management.
 * 
 * @component HomePage
 * @param {Object} props - Component props
 * @param {Object} props.userData - Current user's data and profile information
 * @returns {JSX.Element} Complete homepage with all features
 */
function HomePage({ userData }) {
  const {
    // State
    modalState,
    setModalState,
    loadingState,
    dataState,
    workoutForm,
    setWorkoutForm,
    exerciseForm,
    setExerciseForm,
    helpers,
    
    // Handlers
    handleExerciseClick,
    handleWorkoutSelection,
    handleDeleteExercise,
    handleDeleteCurrentWorkout,
    handleEditExercise,
    handleEditWorkout,
    handleAddExercise,
    handleStartWorkout,
    saveExercise,
    saveWorkout,
  } = useHomePage(userData);

  // Destructuring for cleaner code
  const { lastWorkout, allWorkouts, selectedWorkoutId, stations, games, selectedExercise } = dataState;
  const { isLoadingLastWorkout } = loadingState;
  const { workoutOpen, addExerciseOpen, showExerciseModal, isEditing } = modalState;

  return (
    <Screen titleNode={<UserHeader userData={userData} />}>
      {/* Level Progress Section */}
      
      <LevelProgressBar userData={userData} />

      {/* Workout Selection Section */}
      <div className="mt-4">
  <WorkoutSelector 
          workouts={allWorkouts}
          selectedWorkoutId={selectedWorkoutId}
          onWorkoutSelect={handleWorkoutSelection}
          isLoading={isLoadingLastWorkout}
        />
      </div>
      {/* Workout Statistics Section */}
      
      {!isLoadingLastWorkout && lastWorkout && (
        <WorkoutStats lastWorkout={lastWorkout} />
      )}

      {/* Workout Action Buttons */}
      <WorkoutActions
        onStartWorkout={handleStartWorkout}
        onEditWorkout={handleEditWorkout}
        hasWorkout={!isLoadingLastWorkout && lastWorkout}
        isLoading={isLoadingLastWorkout}
      />

      {/* Exercise List Section */}
      {!isLoadingLastWorkout && lastWorkout && (
        <div className="mt-8">
          <ExerciseSectionHeader onAddExercise={handleAddExercise} />
          <ExerciseList 
            exercises={lastWorkout.exercises}
            helpers={helpers}
            onExerciseClick={handleExerciseClick}
          />
        </div>
      )}

      {/* Modal Components */}
      <WorkoutModal 
        open={workoutOpen}
        onClose={() => setModalState(prev => ({ ...prev, workoutOpen: false, editingWorkout: false }))}
        formData={workoutForm}
        onChange={setWorkoutForm}
        onSave={saveWorkout}
        onDelete={handleDeleteCurrentWorkout}
        isEditing={modalState.editingWorkout}
      />

      <ExerciseModal
        open={addExerciseOpen}
        onClose={() => setModalState(prev => ({ ...prev, addExerciseOpen: false, isEditing: false }))}
        isEditing={isEditing}
        stations={stations}
        games={games}
        formData={exerciseForm}
        onChange={setExerciseForm}
        onSave={saveExercise}
        onDelete={handleDeleteExercise}
      />

      <ExerciseDetailModal
        open={showExerciseModal}
        onClose={() => setModalState(prev => ({ ...prev, showExerciseModal: false }))}
        exercise={selectedExercise}
        helpers={helpers}
        onEdit={handleEditExercise}
      />
    </Screen>
  );
}

export default HomePage;