#!/usr/bin/env node

require('dotenv').config();
const { getPool } = require('../config/database');

const pool = getPool();
const now = new Date().toISOString();

const articleData = {
  title: 'SPACEX STARSHIP COMPLETES HISTORIC ORBITAL REFUELING TEST',
  subtitle: 'Major milestone achieved in reusable rocket technology',
  slug: `spacex-starship-completes-historic-orbital-refueling-test-${Date.now()}`,
  author_id: 2, // Test Author
  category_id: 5, // LAUNCH category
  featured_image_url: null,
  hero_image_url: null,
  content: `<p>SpaceX has successfully completed a historic orbital refueling test of its Starship spacecraft, marking a significant milestone in the development of reusable rocket technology. The test, conducted in low Earth orbit, demonstrated the company's ability to transfer propellant between two Starship vehicles in space.</p>

<p>This achievement is crucial for SpaceX's long-term goal of establishing a permanent human presence on Mars. The ability to refuel spacecraft in orbit eliminates the need to carry all fuel from Earth, dramatically reducing the cost and complexity of interplanetary missions.</p>

<p>"This is a game-changer for deep space exploration," said a SpaceX spokesperson. "Orbital refueling will enable us to send larger payloads to Mars and beyond, making sustainable space travel a reality."</p>

<p>The test involved two Starship prototypes that rendezvoused in orbit. The vehicles successfully docked and transferred cryogenic propellant, proving the concept works in the harsh environment of space. This technology will be essential for NASA's Artemis program and future missions to the Moon and Mars.</p>

<p>SpaceX plans to conduct additional refueling tests in the coming months, with the goal of demonstrating the capability with a full-scale Starship mission. The company is also working on developing the infrastructure needed for regular orbital refueling operations.</p>`,
  excerpt: 'SpaceX successfully completes orbital refueling test, demonstrating key technology for Mars missions and deep space exploration.',
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
  console.log('✅ Article created successfully from admin!');
  console.log('ID:', result.rows[0].id);
  console.log('Title:', result.rows[0].title);
  console.log('Slug:', result.rows[0].slug);
  console.log('Status:', result.rows[0].status);
  console.log('Published At:', result.rows[0].published_at);
  console.log('\n📝 Article Details:');
  console.log('  Category: LAUNCH');
  console.log('  Featured: Yes');
  console.log('  Trending: Yes');
  console.log('  Top Story: Yes');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error creating article:', error.message);
  console.error(error);
  process.exit(1);
});
