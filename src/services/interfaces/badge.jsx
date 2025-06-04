import BaseModel from './BaseModel.js';
import { BADGE_RARITY } from './constants.jsx';

export class Badge extends BaseModel {
  constructor(data = {}) {
    super({
      badgeId: '',
      name: '',
      description: '',
      rarity: BADGE_RARITY.COMMON,
      createdAt: Date.now(),
      rewardPoints: 0,
      ...data
    });
  }

  getRarityColor() {
    const colors = {
      [BADGE_RARITY.COMMON]: '#808080',
      [BADGE_RARITY.UNCOMMON]: '#1eff00',
      [BADGE_RARITY.RARE]: '#0070dd',
      [BADGE_RARITY.EPIC]: '#a335ee',
      [BADGE_RARITY.LEGENDARY]: '#ff8000'
    };
    return colors[this.rarity] || colors[BADGE_RARITY.COMMON];
  }

  getRarityWeight() {
    const weights = {
      [BADGE_RARITY.COMMON]: 1,
      [BADGE_RARITY.UNCOMMON]: 2,
      [BADGE_RARITY.RARE]: 3,
      [BADGE_RARITY.EPIC]: 4,
      [BADGE_RARITY.LEGENDARY]: 5
    };
    return weights[this.rarity] || 1;
  }

  isCommon() {
    return this.rarity === BADGE_RARITY.COMMON;
  }

  isUncommon() {
    return this.rarity === BADGE_RARITY.UNCOMMON;
  }

  isRare() {
    return this.rarity === BADGE_RARITY.RARE;
  }

  isEpic() {
    return this.rarity === BADGE_RARITY.EPIC;
  }

  isLegendary() {
    return this.rarity === BADGE_RARITY.LEGENDARY;
  }

  validate() {
    return this.badgeId && this.name && this.rewardPoints >= 0;
  }
}

export class UserBadge extends BaseModel {
  constructor(data = {}) {
    super({
      badgeInstanceId: '',
      userId: '',
      badgeId: '',
      earnedAt: Date.now(),
      badge: null,
      ...data
    });
  }

  getDaysOld() {
    const diff = Date.now() - this.earnedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getHoursOld() {
    const diff = Date.now() - this.earnedAt;
    return Math.floor(diff / (1000 * 60 * 60));
  }

  isNewlyEarned(hoursThreshold = 24) {
    return this.getHoursOld() <= hoursThreshold;
  }

  validate() {
    return this.badgeInstanceId && this.userId && this.badgeId;
  }

  // Bekomme Badge-Details falls verfügbar
  getBadgeDetails() {
    return this.badge || null;
  }

  // Bekomme Punkte des Badges
  getRewardPoints() {
    return this.badge ? this.badge.rewardPoints : 0;
  }

  // Bekomme Seltenheit des Badges
  getRarity() {
    return this.badge ? this.badge.rarity : BADGE_RARITY.COMMON;
  }

  // Formatiere Earned-Datum
  getFormattedEarnedDate() {
    return new Date(this.earnedAt).toLocaleDateString();
  }
}