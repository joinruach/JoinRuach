import type { Asset, Session } from '@/lib/studio';

export default function AssetStatusCards({
  assets,
  session,
}: {
  assets: Asset[];
  session: Session;
}) {
  // Sort assets by angle (A, B, C)
  const sortedAssets = [...assets].sort((a, b) =>
    a.angle.localeCompare(b.angle)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {sortedAssets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          syncOffset={session.syncOffsets_ms?.[asset.angle]}
          syncConfidence={session.syncConfidence?.[asset.angle]}
        />
      ))}
    </div>
  );
}

function AssetCard({
  asset,
  syncOffset,
  syncConfidence,
}: {
  asset: Asset;
  syncOffset?: number;
  syncConfidence?: number;
}) {
  const getStatusBadge = () => {
    if (asset.transcodingStatus === 'failed')
      return <StatusBadge color="red">Transcoding Failed</StatusBadge>;
    if (asset.transcodingStatus === 'processing')
      return <StatusBadge color="blue">Transcoding...</StatusBadge>;
    if (asset.transcodingStatus === 'complete')
      return <StatusBadge color="green">Ready</StatusBadge>;
    if (asset.uploadStatus === 'complete')
      return <StatusBadge color="yellow">Uploaded</StatusBadge>;
    return <StatusBadge color="gray">Pending</StatusBadge>;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Camera {asset.angle}
        </h3>
        {getStatusBadge()}
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Filename</dt>
          <dd className="mt-1 text-gray-900 dark:text-white font-mono text-xs truncate">
            {asset.filename}
          </dd>
        </div>

        {asset.durationMs && (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Duration</dt>
            <dd className="mt-1 text-gray-900 dark:text-white">
              {Math.floor(asset.durationMs / 60000)}:
              {String(Math.floor((asset.durationMs % 60000) / 1000)).padStart(
                2,
                '0'
              )}
            </dd>
          </div>
        )}

        {syncOffset !== undefined && (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Sync Offset</dt>
            <dd className="mt-1 text-gray-900 dark:text-white font-mono">
              {syncOffset > 0 ? '+' : ''}
              {syncOffset}ms
            </dd>
          </div>
        )}

        {syncConfidence !== undefined && (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">
              Sync Confidence
            </dt>
            <dd className="mt-1 text-gray-900 dark:text-white">
              {syncConfidence.toFixed(2)}
            </dd>
          </div>
        )}

        {asset.r2_proxy_url && (
          <div>
            <a
              href={asset.r2_proxy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ruachGold hover:underline"
            >
              View Proxy
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  color,
  children,
}: {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
  children: React.ReactNode;
}) {
  const colorClasses = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    green:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    yellow:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
