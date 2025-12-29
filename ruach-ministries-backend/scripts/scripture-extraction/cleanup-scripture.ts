const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ STRAPI_API_TOKEN environment variable is required');
  process.exit(1);
}

const BASE_URL = `${STRAPI_URL}/api`;

async function strapiRequest(endpoint: string, method: string = 'GET'): Promise<any> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strapi API error (${response.status}): ${error}`);
  }

  // DELETE requests may return empty responses
  if (method === 'DELETE') {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return response.json();
}

interface StrapiEntity {
  id: number;
  documentId: string;
}

interface StrapiResponse {
  data: StrapiEntity[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

async function deleteAllEntities(contentType: string, label: string): Promise<void> {
  console.log(`\n🗑️  Deleting all ${label}...`);

  let totalDeleted = 0;

  while (true) {
    // Always fetch page 1 since we're deleting as we go
    const response = await strapiRequest(
      `/${contentType}?pagination[page]=1&pagination[pageSize]=100`
    ) as StrapiResponse;

    const entities = response.data;

    if (entities.length === 0) {
      break;
    }

    // Delete all entities in this page
    for (const entity of entities) {
      await strapiRequest(`/${contentType}/${entity.documentId}`, 'DELETE');
      totalDeleted++;

      if (totalDeleted % 100 === 0) {
        console.log(`   Deleted ${totalDeleted} ${label}...`);
      }
    }
  }

  console.log(`✅ Deleted ${totalDeleted} ${label}`);
}

async function cleanup(): Promise<void> {
  console.log('🧹 Starting scripture data cleanup...');
  console.log(`   Strapi URL: ${STRAPI_URL}`);

  try {
    // Delete in order: child entities first, then parent entities
    // This avoids foreign key constraint issues

    // 1. Delete verses (references books)
    await deleteAllEntities('scripture-verses', 'scripture verses');

    // 2. Delete tokens (references verses and lemmas)
    await deleteAllEntities('scripture-tokens', 'scripture tokens');

    // 3. Delete lemmas (standalone)
    await deleteAllEntities('scripture-lemmas', 'scripture lemmas');

    // 4. Delete alignments (references tokens)
    await deleteAllEntities('scripture-alignments', 'scripture alignments');

    // 5. Delete themes (references verses)
    await deleteAllEntities('scripture-themes', 'scripture themes');

    // 6. Delete books (references works)
    await deleteAllEntities('scripture-books', 'scripture books');

    // 7. Delete works (top-level)
    await deleteAllEntities('scripture-works', 'scripture works');

    console.log('\n✅ Cleanup complete! All scripture data has been deleted.');
    console.log('   You can now run the import script to re-import fresh data.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
