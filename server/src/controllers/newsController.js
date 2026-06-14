import News from '../models/News.js';
import { uniqueSlug } from '../utils/slugify.js';
import { publicPath } from '../middleware/upload.js';

/** Public: list published news, newest first. */
export async function listPublished(req, res, next) {
  try {
    const items = await News.find({ published: true })
      .sort({ publishedAt: -1 })
      .select('-content');
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** Public: single published news by slug. */
export async function getBySlug(req, res, next) {
  try {
    const item = await News.findOne({ slug: req.params.slug, published: true });
    if (!item) return res.status(404).json({ error: 'Novica ni najdena.' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

/** Admin: list all news (including unpublished). */
export async function listAll(req, res, next) {
  try {
    const items = await News.find().sort({ createdAt: -1 }).select('-content');
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/** Admin: single by id. */
export async function getById(req, res, next) {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Novica ni najdena.' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

function autoExcerpt(content, excerpt) {
  if (excerpt && excerpt.trim()) return excerpt.trim();
  const text = String(content).replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

/** Admin: create. */
export async function create(req, res, next) {
  try {
    const { title, content, excerpt, author, published } = req.body;
    const slug = await uniqueSlug(News, title);
    const isPublished = published === undefined ? true : published === 'true' || published === true;
    const doc = await News.create({
      title,
      slug,
      content,
      excerpt: autoExcerpt(content, excerpt),
      author: author || 'NK Goričanka',
      published: isPublished,
      publishedAt: isPublished ? new Date() : undefined,
      coverImage: req.file ? publicPath(req.file) : '',
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

/** Admin: update. */
export async function update(req, res, next) {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Novica ni najdena.' });

    const { title, content, excerpt, author, published } = req.body;

    if (title && title !== item.title) {
      item.title = title;
      item.slug = await uniqueSlug(News, title, item._id);
    }
    if (content !== undefined) item.content = content;
    if (excerpt !== undefined || content !== undefined) {
      item.excerpt = autoExcerpt(content ?? item.content, excerpt ?? item.excerpt);
    }
    if (author !== undefined) item.author = author;
    if (published !== undefined) {
      const wasPublished = item.published;
      item.published = published === 'true' || published === true;
      if (item.published && !wasPublished) item.publishedAt = new Date();
    }
    if (req.file) item.coverImage = publicPath(req.file);

    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

/** Admin: delete. */
export async function remove(req, res, next) {
  try {
    const item = await News.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Novica ni najdena.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
