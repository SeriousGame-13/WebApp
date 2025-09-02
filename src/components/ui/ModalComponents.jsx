import { Modal } from './UIComponents';

/**
 * Modal for creating or editing a workout.
 * 
 * @component WorkoutModal
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.formData - Form data object
 * @param {Function} props.onChange - Callback for form changes
 * @param {Function} props.onSave - Callback to save workout
 * @param {Function} props.onDelete - Callback to delete workout
 * @param {boolean} props.isEditing - Whether in edit mode
 * @returns {JSX.Element} Workout modal component
 */
export function WorkoutModal({ open, onClose, formData, onChange, onSave, onDelete, isEditing }) {
  const { workoutName, workoutDescription } = formData;
  
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };
  
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit Workout" : "Create Workout"} size="md">
      <div className="space-y-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Workout Name</div>
          <input 
            value={workoutName} 
            onChange={e => handleChange('workoutName', e.target.value)} 
            className="form-input w-full" 
            placeholder="My Workout"
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">Description</div>
          <textarea 
            value={workoutDescription} 
            onChange={e => handleChange('workoutDescription', e.target.value)} 
            className="form-input w-full" 
            rows="3"
            placeholder="Describe your workout"
          />
        </div>
        <div className="flex justify-end pt-2">
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            {isEditing && <button onClick={onDelete} className="btn-danger">Delete</button>}
            <button onClick={onSave} className="btn-primary">{isEditing ? "Update" : "Save"}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal for adding/editing an exercise.
 * 
 * @component ExerciseModal
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.formData - Form data object
 * @param {Function} props.onChange - Callback for form changes
 * @param {Array} props.stations - Available stations
 * @param {boolean} props.isEditing - Whether in edit mode
 * @param {Function} props.onSave - Callback to save exercise
 * @param {Function} props.onDelete - Callback to delete exercise
 * @returns {JSX.Element} Exercise modal component
 */
export function ExerciseModal({ open, onClose, formData, onChange, stations, isEditing, onSave, onDelete}) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };
  
return (
  <Modal open={open} onClose={onClose} title={isEditing ? "Edit Exercise" : "Add Exercise"} size="md">
    <div className="space-y-4">
      <div className="grid-2 gap-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Exercise Name</div>
          <input 
            value={formData.exerciseName} 
            onChange={e => handleChange('exerciseName', e.target.value)} 
            className="form-input w-full" 
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">Station</div>
          <select 
            value={formData.selectedStation} 
            onChange={e => handleChange('selectedStation', e.target.value)} 
            className="form-input w-full"
          >
            <option value="">Select Station</option>
            {stations.map(station => (
              <option key={station.uid} value={station.uid}>
                {station.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid-2 gap-4">  
        <div>
          <div className="text-sm text-slate-300 mb-1">Start Time</div>
          <input 
            type="datetime-local" 
            value={formData.exerciseStartTime.toISOString().slice(0, 16)} 
            onChange={e => handleChange('exerciseStartTime', new Date(e.target.value))} 
            className="form-input w-full" 
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">End Time</div>
          <input 
            type="datetime-local" 
            value={formData.exerciseEndTime.toISOString().slice(0, 16)} 
            onChange={e => handleChange('exerciseEndTime', new Date(e.target.value))} 
            className="form-input w-full" 
          />
        </div>
      </div>
      
      <div className="grid-2 gap-4">
        <div>
          <div className="text-sm text-slate-300 mb-1">Points</div>
          <input 
            type="number" 
            value={formData.exercisePoints} 
            onChange={e => handleChange('exercisePoints', e.target.value)} 
            className="form-input w-full" 
          />
        </div>
        <div>
          <div className="text-sm text-slate-300 mb-1">Calories</div>
          <input 
            type="number" 
            value={formData.exerciseCals} 
            onChange={e => handleChange('exerciseCals', e.target.value)} 
            className="form-input w-full" 
          />
        </div>
      </div>
      
      <div>
        <div className="text-sm text-slate-300 mb-1">Heart Rate (bpm)</div>
        <div className="grid-3 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Average</div>
            <input 
              type="number" 
              value={formData.exerciseHR} 
              onChange={e => handleChange('exerciseHR', e.target.value)} 
              className="form-input w-full" 
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Maximum</div>
            <input 
              type="number" 
              value={formData.exerciseMaxHR} 
              onChange={e => handleChange('exerciseMaxHR', e.target.value)} 
              className="form-input w-full" 
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Minimum</div>
            <input 
              type="number" 
              value={formData.exerciseMinHR} 
              onChange={e => handleChange('exerciseMinHR', e.target.value)} 
              className="form-input w-full" 
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        {isEditing && <button onClick={onDelete} className="btn-danger">Delete</button>}
        <button onClick={onSave} className="btn-primary">{isEditing ? "Update" : "Save"}</button>
      </div>
    </div>
  </Modal>
);
}

/**
 * Modal for displaying exercise details in read-only mode.
 * 
 * @component ExerciseDetailModal
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.exercise - Exercise data to display
 * @param {Object} props.helpers - Helper functions for data formatting
 * @param {Function} props.onEdit - Callback to switch to edit mode
 * @returns {JSX.Element|null} Exercise detail modal component
 */
export function ExerciseDetailModal({ 
  open, 
  onClose, 
  exercise, 
  helpers, 
  onEdit, 
}) {
  if (!exercise) return null;
  
  const { getStationNameById, getDateFromTimestamp } = helpers;

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="Exercise Details"
      size="md"
    >
      <div className="space-y-4">
        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Exercise Name</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.name || getStationNameById(exercise?.stationId || '')}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">Station</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {getStationNameById(exercise.stationId)}
            </div>
          </div>
        </div>

        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Start Time</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.startTime ? new Date(getDateFromTimestamp(exercise.startTime)).toLocaleString() : '--'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">End Time</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.endTime ? new Date(getDateFromTimestamp(exercise.endTime)).toLocaleString() : '--'}
            </div>
          </div>
        </div>

        <div className="grid-2 gap-4">
          <div>
            <div className="text-sm text-slate-300 mb-1">Points</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.points}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300 mb-1">Calories</div>
            <div className="form-input w-full bg-slate-700 text-slate-200">
              {exercise.calories} kcal
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-300 mb-1">Heart Rate (bpm)</div>
          <div className="grid-3 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Average</div>
              <div className="form-input w-full bg-slate-700 text-slate-200">
                {exercise.heartRateAvg || '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Maximum</div>
              <div className="form-input w-full bg-slate-700 text-slate-200">
                {exercise.heartRateMax || '0'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Minimum</div>
              <div className="form-input w-full bg-slate-700 text-slate-200">
                {exercise.heartRateMin || '0'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">Close</button>
            <button 
              onClick={() => {
                onEdit(exercise);
                onClose();
              }} 
              className="btn-primary"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
