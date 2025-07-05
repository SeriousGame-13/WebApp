import BaseModel from './base.jsx';
import { GROUP_ROLE } from './constants.jsx';
import { serverTimestamp } from 'firebase/firestore';

export class Group extends BaseModel {
  constructor(data = {}) {
    super({
      groupId: '',
      createdBy: '',
      name: '',
      description: '',
      maxMembers: 50,
      members: [],
      creator: null,
      // Added -Hyunu P
      isPrivate: false,
      ...data
    });
  }

  isFull() {
    return this.getActiveMemberCount() >= this.maxMembers;
  }

  addMember(member) {
    if (!this.isFull()) {
      this.members.push(member);
      return true;
    }
    return false;
  }

  removeMember(memberId) {
    this.members = this.members.filter(m => m.membershipId !== memberId);
  }

  getMemberCount() {
    return this.members.length;
  }

  getActiveMemberCount() {
    return this.members.filter(m => m.isActive()).length;
  }

  getAdmins() {
    return this.members.filter(m => m.isAdmin() && m.isActive());
  }

  getModerators() {
    return this.members.filter(m => m.isModerator() && m.isActive());
  }

  getRegularMembers() {
    return this.members.filter(m => m.role === GROUP_ROLE.MEMBER && m.isActive());
  }

  // Check ob User Mitglied ist
  hasMember(userId) {
    return this.members.some(m => m.userId === userId && m.isActive());
  }

  // Bekomme Member eines Users
  getMember(userId) {
    return this.members.find(m => m.userId === userId && m.isActive());
  }

  // Check ob User Admin ist
  isUserAdmin(userId) {
    const member = this.getMember(userId);
    return member && member.isAdmin();
  }

  // Check ob User Moderator oder Admin ist
  isUserModerator(userId) {
    const member = this.getMember(userId);
    return member && (member.isModerator() || member.isAdmin());
  }

  validate() {
    return this.groupId && this.name && this.createdBy;
  }
}

export class GroupMember extends BaseModel {
  constructor(data = {}) {
    super({
      membershipId: '',
      groupId: '',
      userId: '',
      role: GROUP_ROLE.MEMBER,
      joinedAt: serverTimestamp(),
      leftAt: null,
      user: null,
      ...data
    });
  }

  leave() {
    this.leftAt = serverTimestamp();
  }

  rejoin() {
    this.leftAt = null;
    this.joinedAt = serverTimestamp();
  }

  isActive() {
    return this.leftAt === null;
  }

  isAdmin() {
    return this.role === GROUP_ROLE.ADMIN;
  }

  isModerator() {
    return this.role === GROUP_ROLE.MODERATOR;
  }

  isRegularMember() {
    return this.role === GROUP_ROLE.MEMBER;
  }

  promoteToModerator() {
    this.role = GROUP_ROLE.MODERATOR;
  }

  promoteToAdmin() {
    this.role = GROUP_ROLE.ADMIN;
  }

  demoteToMember() {
    this.role = GROUP_ROLE.MEMBER;
  }

  getDaysInGroup() {
    const endTime = this.leftAt || serverTimestamp();
    const diff = endTime - this.joinedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  validate() {
    return this.membershipId && this.groupId && this.userId;
  }

  // Check ob höhere Berechtigung als anderer Member
  hasHigherRoleThan(otherMember) {
    const roleHierarchy = {
      [GROUP_ROLE.MEMBER]: 1,
      [GROUP_ROLE.MODERATOR]: 2,
      [GROUP_ROLE.ADMIN]: 3
    };
    
    return roleHierarchy[this.role] > roleHierarchy[otherMember.role];
  }
}