// Enums als Konstanten
export const FRIENDSHIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked'
};

export const EXERCISE_UNIT = {
  REPS: 'reps',
  TIME: 'time',
  DISTANCE: 'distance',
  WEIGHT: 'weight'
};

export const GROUP_ROLE = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
};

export const BADGE_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const CHALLENGE_TYPE = {
    TOURNAMENT: 'TOURNAMENT',
    INDIVIDUAL: 'INDIVIDUAL',
    GROUP: 'GROUP'
};

export const CHALLENGE_STATUS = {
    OPEN: 'OPEN',
    RUNNING: 'RUNNING',
    FINISHED: 'FINISHED',
    CANCELLED: 'CANCELLED'
};

export const CHALLENGE_PARTICIPATION_STATUS = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    WITHDRAWN: 'WITHDRAWN'
};

//Added
export const CHALLENGE_VISIBILITY = {
  PUBLIC: 'public',
  HIDDEN: 'hidden', 
  GROUP: 'group'
};