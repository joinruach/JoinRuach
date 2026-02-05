import type { Session } from '@/lib/studio';
import { formatDistance } from 'date-fns';

export default function SessionHeader({ session }: { session: Session }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {session.title}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Session ID: <span className="font-mono">{session.sessionId}</span>
            </span>
            <span>•</span>
            <span>
              {formatDistance(new Date(session.createdAt), new Date(), {
                addSuffix: true,
              })}
            </span>
            {session.durationMs && (
              <>
                <span>•</span>
                <span>
                  {Math.floor(session.durationMs / 60000)} minutes
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {session.description && (
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          {session.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            Status
          </dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {session.status.replace('-', ' ')}
          </dd>
        </div>

        {session.operatorStatus && (
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Operator Status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {session.operatorStatus}
            </dd>
          </div>
        )}

        {session.anchorAngle && (
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Master Camera
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              Camera {session.anchorAngle}
            </dd>
          </div>
        )}

        {session.syncMethod && (
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Sync Method
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {session.syncMethod.replace('-', ' ')}
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}
