#!/usr/bin/env node

require('dotenv').config();
const { getPool } = require('../config/database');

const pool = getPool();
const now = new Date().toISOString();

const articleData = {
  title: 'BREAKING: NASA ANNOUNCES NEW MARS ROVER MISSION',
  subtitle: 'Historic mission to explore Martian surface',
  slug: `breaking-nasa-announces-new-mars-rover-mission-${Date.now()}`,
  author_id: 3, // John Spacewriter
  category_id: 4, // NEWS category
  featured_image_url: null,
  hero_image_url: null,
  content: '<p>NASA has announced a groundbreaking new Mars rover mission that will launch in 2027. The mission, named Perseverance 2, will build upon the success of the current Perseverance rover and explore new regions of the Red Planet.</p><p>The rover will be equipped with advanced scientific instruments to search for signs of ancient life and collect samples for future return to Earth. This mission represents a significant step forward in our understanding of Mars and its potential for past or present life.</p>',
  excerpt: 'NASA announces groundbreaking new Mars rover mission set to launch in 2027, building on Perseverance success.',
  status: 'published',
  published_at: now,
  is_featured: true,
  is_trending: true,
  is_top_story: true
};

pool.query(`
  INSERT INTO news_articles (
    title, subtitle, slug, author_id, category_id,
    featured_image_url, hero_image_url, content, excerpt,
    status, published_at, is_featured, is_trending, is_top_story
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
  ) RETURNING id, title, slug, status, published_at
`, [
  articleData.title,
  articleData.subtitle,
  articleData.slug,
  articleData.author_id,
  articleData.category_id,
  articleData.featured_image_url,
  articleData.hero_image_url,
  articleData.content,
  articleData.excerpt,
  articleData.status,
  articleData.published_at,
  articleData.is_featured,
  articleData.is_trending,
  articleData.is_top_story
]).then(result => {
  console.log('✅ Article created successfully!');
  console.log('ID:', result.rows[0].id);
  console.log('Title:', result.rows[0].title);
  console.log('Slug:', result.rows[0].slug);
  console.log('Status:', result.rows[0].status);
  console.log('Published At:', result.rows[0].published_at);
  process.exit(0);
}).catch(error => {
  console.error('❌ Error creating article:', error.message);
  console.error(error);
  process.exit(1);
});
