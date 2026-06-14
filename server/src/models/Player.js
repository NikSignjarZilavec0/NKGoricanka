import mongoose from 'mongoose';

export const POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward'];

const statsSchema = new mongoose.Schema(
  {
    appearances: { type: Number, default: 0, min: 0 },
    goals: { type: Number, default: 0, min: 0 },
    assists: { type: Number, default: 0, min: 0 },
    yellowCards: { type: Number, default: 0, min: 0 },
    redCards: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, enum: POSITIONS, required: true },
    shirtNumber: { type: Number, min: 1, max: 99 },
    birthdate: { type: Date },
    heightCm: { type: Number, min: 100, max: 250 },
    photo: { type: String, default: '' },
    bio: { type: String, default: '' },
    nationality: { type: String, default: 'Slovenija' },
    active: { type: Boolean, default: true },
    stats: { type: statsSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Player', playerSchema);
