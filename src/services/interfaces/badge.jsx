import BaseModel from './Base.jsx';
import { BADGE_RARITY } from './Constants.jsx';
import { serverTimestamp } from '../firebase/FirebaseHelper.jsx';

export class Badge extends BaseModel {
  constructor(data = {}) {
    super({
      name: '',
      description: '',
      rarity: BADGE_RARITY.COMMON,
      rewardPoints: 0,
      collection: 'exercises',
      conditions: 'field:userId,operator:==,value:{user.uid}\n',
      aggregate: 'sum',
      field: 'points',
      valueToReach: '666',
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
      userId: data.userId || '',
      badgeId: data.badgeId || '',
      earnedAt: serverTimestamp(),
      ...data
    });
  }

  getDaysOld() {
    const diff = serverTimestamp() - this.earnedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  isNewlyEarned(hoursThreshold = 24) {
    return this.getHoursOld() <= hoursThreshold;
  }

  validate() {
    return this.badgeInstanceId && this.userId && this.badgeId;
  }

}