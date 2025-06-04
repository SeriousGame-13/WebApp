import BaseModel from './base.jsx';
import { FRIENDSHIP_STATUS } from './constants.jsx';

export default class Friendship extends BaseModel {
  constructor(data = {}) {
    super({
      friendshipId: '',
      user1Id: '',
      user2Id: '',
      status: FRIENDSHIP_STATUS.PENDING,
      createdAt: Date.now(),
      acceptedAt: null,
      friend: null,
      ...data
    });
  }

  accept() {
    this.status = FRIENDSHIP_STATUS.ACCEPTED;
    this.acceptedAt = Date.now();
  }

  block() {
    this.status = FRIENDSHIP_STATUS.BLOCKED;
    this.acceptedAt = null;
  }

  isPending() {
    return this.status === FRIENDSHIP_STATUS.PENDING;
  }

  isAccepted() {
    return this.status === FRIENDSHIP_STATUS.ACCEPTED;
  }

  isBlocked() {
    return this.status === FRIENDSHIP_STATUS.BLOCKED;
  }

  // Bekomme die ID des anderen Users
  getOtherUserId(currentUserId) {
    return this.user1Id === currentUserId ? this.user2Id : this.user1Id;
  }

  // Validierung
  validate() {
    return this.friendshipId && this.user1Id && this.user2Id && this.user1Id !== this.user2Id;
  }

  // Dauer der Freundschaft in Tagen
  getFriendshipDuration() {
    if (!this.acceptedAt) return 0;
    const diff = Date.now() - this.acceptedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

export class Block extends BaseModel {
  constructor(data = {}) {
    super({
      blockId: '',
      userId: '',
      blockedUserId: '',
      createdAt: Date.now(),
      blockedUser: null,
      ...data
    });
  }

  validate() {
    return this.blockId && this.userId && this.blockedUserId && this.userId !== this.blockedUserId;
  }
}