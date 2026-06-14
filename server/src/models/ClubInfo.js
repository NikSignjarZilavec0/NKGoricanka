import mongoose from 'mongoose';

const clubInfoSchema = new mongoose.Schema(
  {
    // Singleton guard: always the same key so only one document can exist.
    key: { type: String, default: 'singleton', unique: true, immutable: true },
    name: { type: String, default: 'NK Goričanka' },
    shortName: { type: String, default: 'Goričanka' },
    foundedYear: { type: Number },
    history: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    colors: {
      primary: { type: String, default: '#c8102e' }, // red
      accent: { type: String, default: '#ffcc00' }, // yellow/gold
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    logo: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('ClubInfo', clubInfoSchema);
