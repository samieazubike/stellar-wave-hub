const express = require('express');
const { db } = require('../config/database');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — List approved projects (public)
router.get('/', optionalAuth, (req, res) => {
  const { category, search, sort = 'newest', page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = "WHERE p.status IN ('approved', 'featured')";
  const params = [];

  if (category) {
    where += ' AND p.category = ?';
    params.push(category);
  }

  if (search) {
    where += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  let orderBy = 'ORDER BY p.created_at DESC';
  if (sort === 'top_rated') orderBy = 'ORDER BY avg_rating DESC';
  if (sort === 'most_rated') orderBy = 'ORDER BY rating_count DESC';
  if (sort === 'featured') orderBy = "ORDER BY (CASE WHEN p.status = 'featured' THEN 0 ELSE 1 END), p.created_at DESC";

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM projects p ${where}`).get(...params);

  const projects = db.prepare(`
    SELECT
      p.*,
      u.display_name as submitter_name,
      u.username as submitter_username,
      u.avatar_url as submitter_avatar,
      COALESCE(AVG(r.score), 0) as avg_rating,
      COALESCE(AVG(r.purpose_score), 0) as avg_purpose,
      COALESCE(AVG(r.innovation_score), 0) as avg_innovation,
      COALESCE(AVG(r.usability_score), 0) as avg_usability,
      COUNT(r.id) as rating_count
    FROM projects p
    LEFT JOIN users u ON p.submitted_by = u.id
    LEFT JOIN ratings r ON r.project_id = p.id
    ${where}
    GROUP BY p.id
    ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  // If authenticated, include user's rating for each project
  if (req.user) {
    const userRatings = db.prepare('SELECT project_id, score FROM ratings WHERE user_id = ?').all(req.user.id);
    const ratingMap = Object.fromEntries(userRatings.map((r) => [r.project_id, r.score]));
    projects.forEach((p) => {
      p.user_rating = ratingMap[p.id] || null;
    });
  }

  res.json({
    projects: projects.map(formatProject),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countRow.total,
      pages: Math.ceil(countRow.total / parseInt(limit)),
    },
  });
});

// GET /api/projects/pending — Admin: list pending submissions
router.get('/pending', authenticate, requireAdmin, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.display_name as submitter_name, u.username as submitter_username
    FROM projects p
    LEFT JOIN users u ON p.submitted_by = u.id
    WHERE p.status = 'pending'
    ORDER BY p.created_at ASC
  `).all();

  res.json({ projects: projects.map(formatProject) });
});

// GET /api/projects/my — List current user's submissions
router.get('/my', authenticate, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*,
      COALESCE(AVG(r.score), 0) as avg_rating,
      COUNT(r.id) as rating_count
    FROM projects p
    LEFT JOIN ratings r ON r.project_id = p.id
    WHERE p.submitted_by = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(req.user.id);

  res.json({ projects: projects.map(formatProject) });
});

// GET /api/projects/:slug — Get single project details
router.get('/:slug', optionalAuth, (req, res) => {
  const project = db.prepare(`
    SELECT p.*,
      u.display_name as submitter_name,
      u.username as submitter_username,
      u.avatar_url as submitter_avatar,
      u.github_url as submitter_github,
      COALESCE(AVG(r.score), 0) as avg_rating,
      COALESCE(AVG(r.purpose_score), 0) as avg_purpose,
      COALESCE(AVG(r.innovation_score), 0) as avg_innovation,
      COALESCE(AVG(r.usability_score), 0) as avg_usability,
      COUNT(r.id) as rating_count
    FROM projects p
    LEFT JOIN users u ON p.submitted_by = u.id
    LEFT JOIN ratings r ON r.project_id = p.id
    WHERE p.slug = ?
    GROUP BY p.id
  `).get(req.params.slug);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Only show non-approved projects to submitter or admin
  if (project.status === 'pending' || project.status === 'rejected') {
    if (!req.user || (req.user.id !== project.submitted_by && req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'Project not found' });
    }
  }

  // Get ratings breakdown
  const ratings = db.prepare(`
    SELECT r.*, u.display_name as reviewer_name, u.username as reviewer_username, u.avatar_url as reviewer_avatar
    FROM ratings r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.project_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(project.id);

  const formatted = formatProject(project);
  formatted.ratings = ratings;

  if (req.user) {
    const userRating = db.prepare('SELECT * FROM ratings WHERE project_id = ? AND user_id = ?').get(project.id, req.user.id);
    formatted.user_rating = userRating || null;
  }

  res.json({ project: formatted });
});

// POST /api/projects — Submit a new project
router.post('/', authenticate, (req, res) => {
  const {
    name, description, long_description, category, repo_url,
    live_url, logo_url, banner_url, stellar_contract_id,
    stellar_account_id, tags,
  } = req.body;

  if (!name || !description || !category || !stellar_account_id || !tags) {
    return res.status(400).json({ error: 'name, description, category, stellar_account_id, and tags are required' });
  }

  const stellarPublicKeyRegex = /^G[A-Z2-7]{55}$/;
  if (!stellarPublicKeyRegex.test(stellar_account_id.trim())) {
    return res.status(400).json({ error: 'stellar_account_id must be a valid Stellar account public key (56 chars, starts with G).' });
  }

  const parsedTags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []);
  if (!Array.isArray(parsedTags) || parsedTags.length === 0) {
    return res.status(400).json({ error: 'tags must be a non-empty array or a comma-separated string.' });
  }

  const longDescriptionWordCount = long_description ? long_description.trim().split(/\s+/).filter(Boolean).length : 0;
  if (longDescriptionWordCount < 200) {
    return res.status(400).json({ error: 'long_description must be at least 200 words for comprehensive market context.' });
  }

  const validCategories = ['defi', 'payments', 'infrastructure', 'tooling', 'nft', 'dao', 'social', 'gaming', 'rwa', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
  }

  // Generate slug
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existingSlug = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug);
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const result = db.prepare(`
    INSERT INTO projects (name, slug, description, long_description, category, repo_url, live_url, logo_url, banner_url, stellar_contract_id, stellar_account_id, tags, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, slug, description, long_description || null, category,
    repo_url || null, live_url || null, logo_url || null, banner_url || null,
    stellar_contract_id || null, stellar_account_id || null,
    parsedTags.length > 0 ? JSON.stringify(parsedTags) : null, req.user.id
  );

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ project: formatProject(project) });
});

// PUT /api/projects/:id/approve — Admin approves a project
router.put('/:id/approve', authenticate, requireAdmin, (req, res) => {
  const { featured } = req.body;
  const status = featured ? 'featured' : 'approved';

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare(`
    UPDATE projects SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ project: formatProject(updated) });
});

// PUT /api/projects/:id/reject — Admin rejects a project
router.put('/:id/reject', authenticate, requireAdmin, (req, res) => {
  const { reason } = req.body;

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare(`
    UPDATE projects SET status = 'rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason || null, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ project: formatProject(updated) });
});

// PUT /api/projects/:id — Update a project (submitter or admin)
router.put('/:id', authenticate, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.id !== project.submitted_by && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only edit your own projects' });
  }

  const {
    name, description, long_description, category, repo_url,
    live_url, logo_url, banner_url, stellar_contract_id,
    stellar_account_id, tags,
  } = req.body;

  if (stellar_account_id) {
    const stellarPublicKeyRegex = /^G[A-Z2-7]{55}$/;
    if (!stellarPublicKeyRegex.test(stellar_account_id.trim())) {
      return res.status(400).json({ error: 'stellar_account_id must be a valid Stellar account public key (56 chars, starts with G).' });
    }
  }

  let normalizedTags = null;
  if (tags) {
    normalizedTags = Array.isArray(tags)
      ? tags.filter((t) => typeof t === 'string' && t.trim())
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : null;

    if (normalizedTags && normalizedTags.length === 0) {
      return res.status(400).json({ error: 'tags must not be empty.' });
    }
  }

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      long_description = COALESCE(?, long_description),
      category = COALESCE(?, category),
      repo_url = COALESCE(?, repo_url),
      live_url = COALESCE(?, live_url),
      logo_url = COALESCE(?, logo_url),
      banner_url = COALESCE(?, banner_url),
      stellar_contract_id = COALESCE(?, stellar_contract_id),
      stellar_account_id = COALESCE(?, stellar_account_id),
      tags = COALESCE(?, tags),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name, description, long_description, category,
    repo_url, live_url, logo_url, banner_url,
    stellar_contract_id, stellar_account_id,
    normalizedTags ? JSON.stringify(normalizedTags) : null, req.params.id
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ project: formatProject(updated) });
});

// DELETE /api/projects/:id — Delete a project (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// Helper: format project for API response
function formatProject(p) {
  return {
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : [],
    avg_rating: p.avg_rating ? Math.round(p.avg_rating * 10) / 10 : 0,
    avg_purpose: p.avg_purpose ? Math.round(p.avg_purpose * 10) / 10 : 0,
    avg_innovation: p.avg_innovation ? Math.round(p.avg_innovation * 10) / 10 : 0,
    avg_usability: p.avg_usability ? Math.round(p.avg_usability * 10) / 10 : 0,
  };
}

module.exports = router;
