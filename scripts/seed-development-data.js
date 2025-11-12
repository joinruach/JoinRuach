/**
 * Seed Development Data
 *
 * Populates the database with sample data for development and testing.
 *
 * Usage:
 *   node scripts/seed-development-data.js
 *
 * Requirements:
 *   - Strapi backend running
 *   - Admin user created
 *   - API token with full permissions
 */

const API_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

if (!API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable is required');
  console.log('Create an API token in Strapi admin: Settings → API Tokens');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
};

// Sample Data

const categories = [
  { name: 'Sermons', slug: 'sermons', description: 'Sunday sermons and teachings' },
  { name: 'Worship', slug: 'worship', description: 'Worship sessions and music' },
  { name: 'Testimonies', slug: 'testimonies', description: 'Personal testimonies of faith' },
  { name: 'Bible Study', slug: 'bible-study', description: 'In-depth Bible study sessions' },
  { name: 'Prayer', slug: 'prayer', description: 'Prayer meetings and teachings' },
];

const speakers = [
  {
    name: 'Pastor John Smith',
    displayName: 'Pastor John',
    bio: 'Senior Pastor with 20 years of ministry experience',
    email: 'john@example.com',
  },
  {
    name: 'Sarah Johnson',
    displayName: 'Sarah J.',
    bio: 'Worship leader and Bible teacher',
    email: 'sarah@example.com',
  },
  {
    name: 'David Williams',
    displayName: 'David W.',
    bio: 'Youth pastor and evangelist',
    email: 'david@example.com',
  },
];

const mediaItems = [
  {
    title: 'Faith That Moves Mountains',
    slug: 'faith-that-moves-mountains',
    description: 'A powerful message about faith and trusting God in difficult times.',
    excerpt: 'Learn how faith can overcome any obstacle.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationSec: 2700,
    featured: true,
    views: 1234,
    likes: 89,
    publishedAt: new Date('2025-11-10'),
    featuredScripture: 'Matthew 17:20',
    scriptureReferences: ['Matthew 17:20', 'Hebrews 11:1', 'James 2:17'],
  },
  {
    title: 'The Power of Prayer',
    slug: 'the-power-of-prayer',
    description: 'Discover the transformative power of prayer in your daily life.',
    excerpt: 'Prayer changes everything.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationSec: 1800,
    featured: true,
    views: 987,
    likes: 65,
    publishedAt: new Date('2025-11-08'),
    featuredScripture: 'Matthew 6:9-13',
    scriptureReferences: ['Matthew 6:9-13', '1 Thessalonians 5:17', 'James 5:16'],
  },
  {
    title: 'Walking in Love',
    slug: 'walking-in-love',
    description: 'Understanding God\'s love and how to love others.',
    excerpt: 'Love is the greatest commandment.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationSec: 2100,
    featured: false,
    views: 765,
    likes: 54,
    publishedAt: new Date('2025-11-05'),
    featuredScripture: '1 Corinthians 13:13',
    scriptureReferences: ['1 Corinthians 13:4-8', 'John 13:34', '1 John 4:8'],
  },
  {
    title: 'Sunday Worship: Great is Thy Faithfulness',
    slug: 'sunday-worship-great-is-thy-faithfulness',
    description: 'Powerful worship session celebrating God\'s faithfulness.',
    excerpt: 'Join us in worship.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationSec: 3600,
    featured: false,
    views: 543,
    likes: 42,
    publishedAt: new Date('2025-11-03'),
  },
  {
    title: 'Testimony: From Darkness to Light',
    slug: 'testimony-darkness-to-light',
    description: 'A powerful testimony of transformation through Christ.',
    excerpt: 'God can change anyone.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationSec: 900,
    featured: false,
    views: 432,
    likes: 38,
    publishedAt: new Date('2025-11-01'),
    featuredScripture: '2 Corinthians 5:17',
  },
];

const courses = [
  {
    title: 'Biblical Foundations',
    slug: 'biblical-foundations',
    description: 'Essential teachings for new believers and those wanting to deepen their faith.',
    price: 0,
    featured: true,
    durationWeeks: 6,
  },
  {
    title: 'Spiritual Warfare Training',
    slug: 'spiritual-warfare-training',
    description: 'Learn to stand firm against spiritual attacks and walk in victory.',
    price: 0,
    featured: true,
    durationWeeks: 8,
  },
  {
    title: 'Leadership Development',
    slug: 'leadership-development',
    description: 'Develop godly leadership skills for ministry and life.',
    price: 0,
    featured: false,
    durationWeeks: 12,
  },
];

const series = [
  {
    title: 'Journey Through Romans',
    slug: 'journey-through-romans',
    description: 'A verse-by-verse study through the book of Romans.',
    episodeCount: 16,
  },
  {
    title: 'The Gospel of John',
    slug: 'the-gospel-of-john',
    description: 'Exploring the life and teachings of Jesus through John\'s gospel.',
    episodeCount: 21,
  },
];

const events = [
  {
    title: 'Sunday Service',
    slug: 'sunday-service',
    description: 'Weekly Sunday worship service',
    date: new Date('2025-11-17T10:00:00Z'),
    location: 'Main Sanctuary',
  },
  {
    title: 'Wednesday Prayer Meeting',
    slug: 'wednesday-prayer-meeting',
    description: 'Midweek prayer and Bible study',
    date: new Date('2025-11-13T19:00:00Z'),
    location: 'Prayer Room',
  },
  {
    title: 'Youth Night',
    slug: 'youth-night',
    description: 'Fun and worship for young people',
    date: new Date('2025-11-15T18:30:00Z'),
    location: 'Youth Center',
  },
];

// Helper functions

async function request(endpoint, method = 'GET', data = null) {
  const url = `${API_URL}/api/${endpoint}`;
  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify({ data });
  }

  try {
    const response = await fetch(url, options);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error?.message || 'Request failed');
    }

    return json;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

async function createCategories() {
  console.log('\n📁 Creating categories...');

  const created = [];

  for (const category of categories) {
    try {
      const result = await request('categories', 'POST', category);
      created.push(result.data);
      console.log(`  ✓ Created: ${category.name}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${category.name} (${error.message})`);
    }
  }

  return created;
}

async function createSpeakers() {
  console.log('\n🎤 Creating speakers...');

  const created = [];

  for (const speaker of speakers) {
    try {
      const result = await request('speakers', 'POST', speaker);
      created.push(result.data);
      console.log(`  ✓ Created: ${speaker.name}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${speaker.name} (${error.message})`);
    }
  }

  return created;
}

async function createMediaItems(categoryIds, speakerIds) {
  console.log('\n🎬 Creating media items...');

  const created = [];

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];

    // Assign category (rotate through categories)
    const categoryId = categoryIds[i % categoryIds.length];

    // Assign speaker (rotate through speakers)
    const speakerId = speakerIds[i % speakerIds.length];

    const data = {
      ...item,
      category: categoryId,
      speakers: [speakerId],
    };

    try {
      const result = await request('media-items', 'POST', data);
      created.push(result.data);
      console.log(`  ✓ Created: ${item.title}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${item.title} (${error.message})`);
    }
  }

  return created;
}

async function createCourses() {
  console.log('\n📚 Creating courses...');

  const created = [];

  for (const course of courses) {
    try {
      const result = await request('courses', 'POST', course);
      created.push(result.data);
      console.log(`  ✓ Created: ${course.title}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${course.title} (${error.message})`);
    }
  }

  return created;
}

async function createSeries() {
  console.log('\n📺 Creating series...');

  const created = [];

  for (const seriesItem of series) {
    try {
      const result = await request('series', 'POST', seriesItem);
      created.push(result.data);
      console.log(`  ✓ Created: ${seriesItem.title}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${seriesItem.title} (${error.message})`);
    }
  }

  return created;
}

async function createEvents() {
  console.log('\n📅 Creating events...');

  const created = [];

  for (const event of events) {
    try {
      const result = await request('events', 'POST', event);
      created.push(result.data);
      console.log(`  ✓ Created: ${event.title}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${event.title} (${error.message})`);
    }
  }

  return created;
}

// Main execution

async function main() {
  console.log('🌱 Seeding Development Data');
  console.log('=============================');
  console.log(`API URL: ${API_URL}`);

  try {
    // Create categories
    const createdCategories = await createCategories();
    const categoryIds = createdCategories.map(c => c.id);

    // Create speakers
    const createdSpeakers = await createSpeakers();
    const speakerIds = createdSpeakers.map(s => s.id);

    // Create media items
    await createMediaItems(categoryIds, speakerIds);

    // Create courses
    await createCourses();

    // Create series
    await createSeries();

    // Create events
    await createEvents();

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`  Categories: ${createdCategories.length}/${categories.length}`);
    console.log(`  Speakers: ${createdSpeakers.length}/${speakers.length}`);
    console.log(`  Media Items: ${mediaItems.length}`);
    console.log(`  Courses: ${courses.length}`);
    console.log(`  Series: ${series.length}`);
    console.log(`  Events: ${events.length}`);
    console.log('\n🎉 Your development database is ready!');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seeder
main();
