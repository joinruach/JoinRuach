/**
 * Example Upload Page
 *
 * This file demonstrates how to use the FileUpload component
 * with the presigned upload system.
 *
 * To use this in your app:
 * 1. Copy this file to: src/app/upload-test/page.tsx
 * 2. Navigate to: http://localhost:3000/upload-test
 * 3. Try uploading different file types
 *
 * Or integrate into your existing forms/pages as shown below.
 */

'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ruach/FileUpload';
import { UploadResult } from '@/hooks/usePresignedUpload';

export default function UploadExamplePage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [selectedType, setSelectedType] = useState<'image' | 'video' | 'audio' | 'document'>('image');

  const handleUploadComplete = (result: UploadResult) => {
    console.log('Upload complete:', result);
    setUploadedFiles((prev) => [...prev, result]);

    // Show success notification
    alert(`File uploaded successfully!\nURL: ${result.publicUrl}`);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error.message}`);
  };

  const getAcceptTypes = () => {
    switch (selectedType) {
      case 'image':
        return ['image/*'];
      case 'video':
        return ['video/*'];
      case 'audio':
        return ['audio/*'];
      case 'document':
        return ['.pdf', '.doc', '.docx'];
      default:
        return ['image/*'];
    }
  };

  const getMaxSize = () => {
    switch (selectedType) {
      case 'image':
        return 50 * 1024 * 1024; // 50MB
      case 'video':
        return 4 * 1024 * 1024 * 1024; // 4GB
      case 'audio':
        return 500 * 1024 * 1024; // 500MB
      case 'document':
        return 100 * 1024 * 1024; // 100MB
      default:
        return 100 * 1024 * 1024;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Presigned Upload Test Page</h1>

      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Test the presigned upload functionality by uploading different types of files.
        Files are uploaded directly to Cloudflare R2.
      </p>

      {/* File Type Selector */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Select File Type:
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="image">Images (50MB max)</option>
          <option value="video">Videos (4GB max)</option>
          <option value="audio">Audio (500MB max)</option>
          <option value="document">Documents (100MB max)</option>
        </select>
      </div>

      {/* Upload Component */}
      <FileUpload
        accept={getAcceptTypes()}
        maxSize={getMaxSize()}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        label={`Upload ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
        showPreview={selectedType === 'image'}
      />

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Uploaded Files</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {file.filename}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  Type: {file.mimeType} • Size: {formatFileSize(file.size)}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2196f3', textDecoration: 'underline' }}
                  >
                    View File →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Integration Examples</h3>

        <h4 style={{ marginBottom: '0.5rem' }}>1. Basic Usage</h4>
        <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`import { FileUpload } from '@/components/ruach/FileUpload';

export default function MyPage() {
  return (
    <FileUpload
      accept={['image/*']}
      onUploadComplete={(result) => {
        console.log('Uploaded:', result.publicUrl);
      }}
    />
  );
}`}
        </pre>

        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Video Upload</h4>
        <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`import { FileUpload } from '@/components/ruach/FileUpload';

export default function VideoUpload() {
  return (
    <FileUpload
      accept={['video/mp4', 'video/webm']}
      maxSize={4 * 1024 * 1024 * 1024} // 4GB
      label="Upload Video"
      onUploadComplete={(result) => {
        // Save video URL to database
        fetch('/api/videos', {
          method: 'POST',
          body: JSON.stringify({ url: result.publicUrl }),
        });
      }}
    />
  );
}`}
        </pre>

        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>3. Using the Hook Directly</h4>
        <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`import { usePresignedUpload } from '@/hooks/usePresignedUpload';

export default function CustomUpload() {
  const { upload, status, progress } = usePresignedUpload();

  const handleUpload = async (file: File) => {
    await upload({
      file,
      onProgress: (p) => console.log(\`\${p}%\`),
      onComplete: (result) => console.log('Done!', result),
    });
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleUpload(e.target.files[0])}
      />
      {status === 'uploading' && <div>{progress}%</div>}
    </div>
  );
}`}
        </pre>
      </div>

      {/* Documentation Link */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <p style={{ margin: 0 }}>
          📚 <strong>For full documentation, see:</strong>{' '}
          <code>PRESIGNED_UPLOAD_IMPLEMENTATION.md</code>
        </p>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
