import express from 'express';
import Movie from '../models/Movie.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/movies
// @access  Public
router.get('/', async (req, res) => {
  try {
    const genre = req.query.genre;
    let query = {};
    if (genre) {
      query = { genres: genre };
    }
    const movies = await Movie.find(query);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/movies/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    // Basic recommendation system: High rated movies
    // Could be extended to AI-based by integrating external services
    const movies = await Movie.find({}).sort({ rating: -1 }).limit(10);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/movies/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (movie) {
      // Free users might only see trailer, premium see full videoUrl
      // we'll handle this purely in frontend for simplicity or here
      if (!req.user.isPremium && req.user.role !== 'admin') {
         return res.status(403).json({ message: 'Premium subscription required to view full details' });
      }
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/movies
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    const createdMovie = await movie.save();
    res.status(201).json(createdMovie);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/movies/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMovie);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/movies/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
