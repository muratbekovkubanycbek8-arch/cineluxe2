import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genres: [{ type: String }],
  rating: { type: Number, default: 0 },
  posterUrl: { type: String },
  videoUrl: { type: String }, // link to the fake movie file!
  releaseYear: { type: Number },
}, { timestamps: true });

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
