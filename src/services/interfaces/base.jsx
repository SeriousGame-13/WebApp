// Base Model Klasse
import {v4 as uuidv4} from 'uuid';

export default class BaseModel {
  constructor(data = {}) {
    this.uid = data.uid || uuidv4();
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }

  static fromJSON(data) {
    return new this(data);
  }

  // Helper method für Validierung
  validate() {
    // Überschreibbar in Subklassen
    return true;
  }

  // Deep clone
  clone() {
    return new this.constructor(JSON.parse(JSON.stringify(this)));
  }

  // Update mit neuen Daten
  update(data) {
    Object.assign(this, data);
    return this;
  }

  // 
  getCreateAt(){
    const createdAtDate = this.createdAt?.toDate?.() ?? new Date(this.createdAt);
    return createdAtDate.toLocaleString();
  }
}