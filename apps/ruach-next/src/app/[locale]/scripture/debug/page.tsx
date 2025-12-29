import { getScriptureWorks } from '@/lib/strapi';

export default async function ScriptureDebugPage() {
  let works: Awaited<ReturnType<typeof getScriptureWorks>> = [];
  let error = null;

  try {
    works = await getScriptureWorks();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Scripture Debug] Error fetching works:', e);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Scripture API Debug</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">API Configuration</h2>
          <p><strong>Strapi URL:</strong> {process.env.NEXT_PUBLIC_STRAPI_URL || 'Not set'}</p>
          <p><strong>Has API Token:</strong> {process.env.STRAPI_API_TOKEN ? 'Yes' : 'No'}</p>
        </div>

        {error ? (
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2 text-red-800 dark:text-red-200">Error</h2>
            <pre className="text-sm overflow-auto">{error}</pre>
          </div>
        ) : null}

        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Results</h2>
          <p><strong>Total works found:</strong> {works.length}</p>
          {works.length > 0 && (
            <>
              <p><strong>First work:</strong></p>
              <pre className="text-sm overflow-auto mt-2 bg-white dark:bg-gray-800 p-2 rounded">
                {JSON.stringify(works[0], null, 2)}
              </pre>
            </>
          )}
        </div>

        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">All Works</h2>
          <pre className="text-sm overflow-auto bg-white dark:bg-gray-800 p-2 rounded">
            {JSON.stringify(works, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
