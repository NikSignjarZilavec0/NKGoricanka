import mongoose from 'mongoose';

export const MATCH_STATUS = ['upcoming', 'finished', 'cancelled'];

const scorerSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    minute: { type: Number, min: 1, max: 130 },
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    ours: { type: Number, min: 0, default: null },
    theirs: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    opponent: { type: String, required: true, trim: true },
    opponentLogo: { type: String, default: '' },
    isHome: { type: Boolean, default: true },
    date: { type: Date, required: true },
    location: { type: String, default: '' },
    competition: { type: String, default: '1. MNL Murska Sobota' },
    season: { type: String, default: '' },
    status: { type: String, enum: MATCH_STATUS, default: 'upcoming' },
    score: { type: scoreSchema, default: () => ({}) },
    scorers: { type: [scorerSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Match', matchSchema);
