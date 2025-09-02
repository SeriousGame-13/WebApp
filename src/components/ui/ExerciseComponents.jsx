import { Card } from './UIComponents';

/**
 * Displays a grid of exercise cards with interaction capability.
 * 
 * @component ExerciseList
 * @param {Object} props - Component props
 * @param {Array<Exercise>} props.exercises - Array of exercises to display
 * @param {Object} props.helpers - Helper functions for data formatting
 * @param {Function} props.onExerciseClick - Callback when exercise is clicked
 * @returns {JSX.Element} Exercise list component
 */
export function ExerciseList({ exercises, helpers, onExerciseClick }) {
  const { getStationNameById, getDateFromTimestamp } = helpers;
  
  if (!exercises || exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No exercises in this workout yet. </p>
        <p className="text-slate-400">Add an exercise to get started!</p>
      </div>
    );
  }
  
  return (
    <div className="grid-2 gap-3">
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={exercise.uid || index}
          exercise={exercise}
          helpers={helpers}
          onClick={() => onExerciseClick(exercise)}
        />
      ))}
    </div>
  );
}

/**
 * Individual exercise card component.
 * 
 * @component ExerciseCard
 * @param {Object} props - Component props
 * @param {Exercise} props.exercise - The exercise data to display
 * @param {Object} props.helpers - Helper functions for data formatting
 * @param {Function} props.onClick - Callback when card is clicked
 * @returns {JSX.Element} Exercise card component
 */
export function ExerciseCard({ exercise, helpers, onClick }) {
  const { getStationNameById, getDateFromTimestamp } = helpers;
  
  return (
    <Card className="exercise-card" onClick={onClick}>
      <div className="font-medium mb-1 mt-4">
        {exercise.name || getStationNameById(exercise.stationId)}
      </div>
      <div className="text-xs text-slate-400 mb-1">
        {getStationNameById(exercise.stationId)}
      </div>
      {exercise.startTime && exercise.endTime && (
        <div className="text-xs text-slate-500 mb-2">
          {(() => {
            const start = getDateFromTimestamp(exercise.startTime);
            const end = getDateFromTimestamp(exercise.endTime);
            const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${startTime} - ${endTime}`;
          })()}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-400">
          {exercise.points} points
        </div>
        <div className="text-xs text-slate-500">
          {exercise.calories} kcal
        </div>
      </div>
    </Card>
  );
}

/**
 * Section header for exercises with add button.
 * 
 * @component ExerciseSectionHeader
 * @param {Object} props - Component props
 * @param {Function} props.onAddExercise - Callback for adding new exercise
 * @returns {JSX.Element} Exercise section header
 */
export function ExerciseSectionHeader({ onAddExercise }) {
  return (
    <div className="flex justify-between items-center mb-3 mb-8">
      <h3 className="text-lg font-semibold text-gradient">Latest Exercises</h3>
      <button 
        onClick={onAddExercise}
        className="btn-primary text-sm px-3 py-1 rounded-full"
      >
        Add Exercise
      </button>
    </div>
  );
}
