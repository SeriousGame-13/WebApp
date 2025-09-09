# Interfaces – Feldübersicht (ohne Verknüpfungen)

Hinweis: Alle Klassen erben von `BaseModel` und enthalten dadurch zusätzlich die Standardfelder:
- `uid`
- `createdAt`
- `updatedAt`

Die folgenden Auflistungen spiegeln die im Konstruktor gesetzten Felder wider (Stand: Codebasis). Es werden bewusst keine Beziehungen/FK-Hinweise aufgeführt.

---

## BaseModel (src/services/interfaces/base.jsx)
- (gemeinsame Felder, s. Hinweis oben)

---

## Badge (src/services/interfaces/badge.jsx)
- name
- description
- rarity
- rewardPoints
- collection
- conditions
- aggregate
- field
- valueToReach

### UserBadge
- userId
- badgeId
- earnedAt

---

## Challenge (src/services/interfaces/challenge.jsx)
- name
- description
- startDate
- endDate
- creatorId
- rewardPoints
- challengeType
- challengeStyle
- targetValue
- targetField
- participants (Array)
- status
- progress
- conditions (Array)

### ChallengeParticipant
- challengeId
- userId
- joinedAt
- completedAt
- currentValue
- status

---

## Exercise (src/services/interfaces/exercise.jsx)
- points
- startTime
- endTime
- heartRateAvg
- calories
- userId
- stationId

---

## Friendship (src/services/interfaces/friendship.jsx)
- user1Id
- user2Id
- status
- acceptedAt
- friend

### Block
- blockId
- userId
- blockedUserId
- blockedUser

---

## UserGoal (src/services/interfaces/goal.jsx)
- userId
- stationId
- deadline
- exercise

---

## Group (src/services/interfaces/group.jsx)
- alias
- createdBy
- name
- description
- maxMembers
- members (Array)
- creator
- isPrivate

### GroupMember
- membershipId
- groupId
- userId
- role
- joinedAt
- leftAt
- user

---

## Highscore (src/services/interfaces/highscore.jsx)
- metric
- score
- userId
- stationId
- exerciseId

---

## Station (src/services/interfaces/station.jsx)
- name
- gameId

### StationGame
- name
- stationId

---

## User (src/services/interfaces/user.jsx)
- email
- displayName
- isActive
- isAdmin
- level
- points
- longestStreak
- workouts (Array)
- badges (Array)
- challenges (Array)

---

## Workout (src/services/interfaces/workout.jsx)
- uid (falls übergeben)
- userId
- name
- description
- exercises (Array)

Hinweis (berechnete/abgeleitete Werte zur Anzeige, nicht im Konstruktor gesetzt):
- points (berechnet)
- calories (berechnet)
- heartRateAvg / heartRateMin / heartRateMax (berechnet)
- startTime / endTime (aus Exercises abgeleitet)
