type PlatformStatus = 'success' | 'failed' | 'pending' | 'not-configured';

interface PlatformStatusIconProps {
  status: PlatformStatus;
  platform: string;
}

const platformIcons: Record<string, string> = {
  youtube: '📺',
  facebook: '👥',
  instagram: '📷',
  x: '🐦',
  patreon: '💰',
  rumble: '🎬',
  locals: '🏘️',
  truthsocial: '🗽',
};

const statusIcons: Record<PlatformStatus, string> = {
  success: '✅',
  failed: '❌',
  pending: '⏳',
  'not-configured': '➖',
};

const statusColors: Record<PlatformStatus, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  pending: 'text-yellow-600',
  'not-configured': 'text-gray-400',
};

export default function PlatformStatusIcon({ status, platform }: PlatformStatusIconProps) {
  const platformIcon = platformIcons[platform.toLowerCase()] || '🌐';
  const statusIcon = statusIcons[status];
  const statusColor = statusColors[status];

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{platformIcon}</span>
      <span className={`text-xl ${statusColor}`}>{statusIcon}</span>
    </div>
  );
}
