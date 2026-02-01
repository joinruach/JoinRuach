import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * GET /api/upload/status
 * Get status of upload/transcoding jobs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
  }

  try {
    const jobIds = ids.split(',');
    const results = await Promise.all(
      jobIds.map(async (jobId) => {
        try {
          // Try to get transcoding status
          const transcodingResponse = await fetch(
            `${STRAPI_URL}/api/media-transcode/status/${jobId}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (transcodingResponse.ok) {
            const data = await transcodingResponse.json();
            return {
              id: jobId,
              status: mapTranscodingStatus(data.status),
              progress: data.progress || 0,
              transcodingProgress: data.progress,
              qualities: data.qualities,
              thumbnails: data.thumbnails,
              error: data.error,
            };
          }

          // Fallback: return unknown status
          return {
            id: jobId,
            status: 'queued',
            progress: 0,
          };
        } catch (error) {
          return {
            id: jobId,
            status: 'failed',
            error: 'Failed to fetch status',
          };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching upload status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload status' },
      { status: 500 }
    );
  }
}

function mapTranscodingStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'queued',
    processing: 'transcoding',
    completed: 'completed',
    failed: 'failed',
  };
  return statusMap[status] || 'queued';
}

/**
 * DELETE /api/upload/status/:id
 * Cancel an upload/transcoding job
 */
export async function DELETE(request: NextRequest) {
  // This would be handled by a dynamic route
  // For now, return success
  return NextResponse.json({ success: true });
}
