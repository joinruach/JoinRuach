import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Initialize S3 client for R2
const getS3Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.strapiJwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const contentType = formData.get('contentType') as string;
    const sourceId = formData.get('sourceId') as string;

    if (!file || !contentType || !sourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, contentType, sourceId' },
        { status: 400 }
      );
    }

    // Calculate file hash for deduplication
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Generate version ID
    const timestamp = Date.now();
    const versionId = `${sourceId}:v${timestamp}`;

    // Upload to R2
    const s3Client = getS3Client();
    const key = `ingestion/${sourceId}/${versionId}${getFileExtension(file.name)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_INGESTION_BUCKET_NAME || process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
      Metadata: {
        sourceId,
        versionId,
        fileHash,
        originalName: file.name,
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const fileUrl = `${process.env.R2_CDN_URL || process.env.R2_PUBLIC_URL}/${key}`;

    // Enqueue ingestion job via Strapi API
    const enqueueResponse = await fetch(`${STRAPI_URL}/api/ingestion/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.strapiJwt}`,
      },
      body: JSON.stringify({
        contentType,
        sourceId,
        versionId,
        fileUrl,
        fileType: contentType.split('/')[1] === 'pdf' ? 'pdf' : 'docx',
        fileHash,
        fileSizeBytes: file.size,
        ingestionParams: {
          testament: formData.get('testament') || 'all',
          preserveFormatting: formData.get('preserveFormatting') === 'true',
          validateCanonical: formData.get('validateCanonical') === 'true',
        },
      }),
    });

    if (!enqueueResponse.ok) {
      const error = await enqueueResponse.text();
      return NextResponse.json(
        { error: `Failed to enqueue ingestion: ${error}` },
        { status: 500 }
      );
    }

    const jobData = await enqueueResponse.json();

    return NextResponse.json({
      success: true,
      versionId,
      fileUrl,
      jobId: jobData.jobId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}
