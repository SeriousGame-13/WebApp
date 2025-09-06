import { Card, Stat } from './UIComponents';

/**
 * Displays workout selection dropdown with metadata.
 * 
 * @component WorkoutSelector
 * @param {Object} props - Component props
 * @param {Array<Workout>} props.workouts - Available workouts
 * @param {string} props.selectedWorkoutId - Currently selected workout ID
 * @param {Function} props.onWorkoutSelect - Callback when workout is selected
 * @param {Object} props.helpers - Helper functions for data formatting
 * @param {boolean} props.isLoading - Loading state indicator
 * @returns {JSX.Element} Workout selector component
 */
export function WorkoutSelector({ workouts, selectedWorkoutId, onWorkoutSelect, isLoading }) {
  if (isLoading) {
    return (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Select Workout</span>
          </div>
          <div className="text-slate-500 text-sm">Loading workouts...</div>
        </Card>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Select Workout</span>
        </div>
        <div className="text-slate-500 text-sm">No workouts available</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">Select Workout</span>
        <span className="text-slate-300 text-sm">{workouts.length} workout{workouts.length !== 1 ? 's' : ''}</span>
      </div>
      <select 
        value={selectedWorkoutId || ''} 
        onChange={(e) => onWorkoutSelect(e.target.value)}
        className="form-input w-full"
      >
        {workouts.map((workout, index) => {
            const date = workout.getCreateAt();
            const formattedDate = date.toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            });

          
          return (
            <option key={workout.uid || index} value={workout.uid}>
              {workout.name} - {formattedDate}
            </option>
          );
        })}
      </select>
    </Card>
  );
}

/**
 * Displays comprehensive workout statistics.
 * 
 * @component WorkoutStats
 * @param {Object} props - Component props
 * @param {Workout} props.lastWorkout - The workout to display stats for
 * @returns {JSX.Element|null} Workout statistics grid or null if no workout
 */
export function WorkoutStats({ lastWorkout }) {
  if (!lastWorkout) return null;
    
  return (
    <div className="grid-2 mt-4">
      <Card>
        <Stat 
          label="DURATION" 
          value={
            <div className="flex flex-col leading-tight">
              <div className="flex gap-4 text-base">
                <span><span className="text-slate-400">Active</span> {lastWorkout.getActiveTimeFormatted()}</span>
                <span><span className="text-slate-400">Idle</span> {lastWorkout.getIdleTimeFormatted()}</span>
              </div>
              <span className="text-xs text-slate-400 mt-1">Total {lastWorkout.getDurationFormatted()}</span>
            </div>
          }
        />
      </Card>
      <Card><Stat label="POINTS" value={lastWorkout.points} /></Card>
      <Card><Stat label="CALORIES" value={<>{lastWorkout.calories} kcal</>} /></Card>
      <Card><Stat label="AVG HEART RATE" value={<>{lastWorkout.heartRateAvg || '--'} bpm</>} /></Card>
      <Card><Stat label="MIN HEART RATE" value={<>{lastWorkout.heartRateMin || '--'} bpm</>} /></Card>
      <Card><Stat label="MAX HEART RATE" value={<>{lastWorkout.heartRateMax || '--'} bpm</>} /></Card>
    </div>
  );
}

/**
 * Action buttons for workout operations.
 * 
 * @component WorkoutActions
 * @param {Object} props - Component props
 * @param {Function} props.onStartWorkout - Callback for starting new workout
 * @param {Function} props.onEditWorkout - Callback for editing current workout
 * @param {boolean} props.hasWorkout - Whether a workout is currently selected
 * @param {boolean} props.isLoading - Loading state indicator
 * @returns {JSX.Element} Workout action buttons
 */
export function WorkoutActions({ onStartWorkout, onEditWorkout, hasWorkout, isLoading }) {
  return (
    <div className="mt-6 grid-2 gap-3">
      <button 
        onClick={onStartWorkout} 
        className="btn-primary py-3"
        disabled={isLoading}
      >
        Start Workout
      </button>
      
      {!isLoading && hasWorkout && (
        <button 
          onClick={onEditWorkout}
          className="btn-secondary py-3"
        >
          Edit Workout
        </button>
      )}
    </div>
  );
}
