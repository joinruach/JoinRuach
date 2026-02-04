import { auth } from '@/lib/auth';
import { hasStudioAccess, getRoleName } from '@/lib/authorization';

/**
 * Debug page to check authorization
 * Access at: /studio/debug
 */
export default async function DebugPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Authorization Debug</h1>

      <div className="space-y-4">
        {/* Session Status */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Session Status</h2>
            <p><strong>Authenticated:</strong> {session ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* User Info */}
        {session && (
          <>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">User Info</h2>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Name:</strong> {session.user?.name}</p>
                <p><strong>User ID:</strong> {session.userId || 'Not set'}</p>
              </div>
            </div>

            {/* Role Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Role Information</h2>
                <p><strong>Role (raw):</strong> <code className="bg-gray-200 px-2 py-1 rounded">{session.role || 'undefined'}</code></p>
                <p><strong>Role (display):</strong> {getRoleName(session.role)}</p>
                <p><strong>Has Studio Access:</strong> {hasStudioAccess(session.role) ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>

            {/* Authorization Check */}
            <div className={`card shadow-xl ${hasStudioAccess(session.role) ? 'bg-success' : 'bg-error'}`}>
              <div className="card-body text-white">
                <h2 className="card-title">Authorization Result</h2>
                {hasStudioAccess(session.role) ? (
                  <p>✅ This user SHOULD have studio access</p>
                ) : (
                  <p>❌ This user should NOT have studio access (but you're seeing this page, so auth is broken)</p>
                )}
              </div>
            </div>

            {/* Full Session Object */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Full Session Object</h2>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
