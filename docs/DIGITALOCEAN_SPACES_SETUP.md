# DigitalOcean Spaces Setup Guide

## Overview

This guide covers setting up DigitalOcean Spaces buckets required for the JoinRuach application deployment.

**Last Updated:** 2025-11-04

---

## Required Buckets

The application requires the following DigitalOcean Spaces buckets:

1. **appbuild-logs** - Stores build logs from the deployment pipeline
2. **joinruach-media** (optional) - Alternative to Cloudflare R2 for media storage

---

## Setup Instructions

### 1. Create DigitalOcean Spaces Bucket

#### Via DigitalOcean Dashboard:

1. **Log in to DigitalOcean**
   - Navigate to https://cloud.digitalocean.com/

2. **Create Spaces Bucket**
   - Click on "Spaces" in the left sidebar
   - Click "Create Space"
   - Configure the bucket:
     - **Choose a datacenter region**: Select closest to your servers (e.g., `nyc3`, `sfo3`)
     - **Choose a unique name**: `appbuild-logs`
     - **Enable CDN**: No (not needed for build logs)
     - **File Listing**: Private (recommended)
     - **Project**: Select your project

3. **Create the Bucket**
   - Click "Create Space"
   - Note the bucket URL: `https://appbuild-logs.nyc3.digitaloceanspaces.com`

#### Via DigitalOcean CLI (doctl):

```bash
# Install doctl if not already installed
# macOS: brew install doctl
# Linux: wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz

# Authenticate
doctl auth init

# Create the appbuild-logs bucket
doctl spaces create appbuild-logs --region nyc3

# Verify bucket creation
doctl spaces list
```

---

### 2. Generate Spaces Access Keys

#### Via Dashboard:

1. **Navigate to API Settings**
   - Go to API > Spaces Keys
   - Click "Generate New Key"

2. **Configure Key**
   - **Name**: `appbuild-logs-access`
   - Click "Generate Key"

3. **Save Credentials**
   - **Access Key ID**: `DO00XXXXXXXXXXXXX`
   - **Secret Access Key**: `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - ⚠️ **IMPORTANT**: Save these immediately - you won't be able to see the secret again

---

### 3. Configure Bucket Permissions

The `appbuild-logs` bucket should have restricted access:

#### CORS Configuration (if needed):

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://joinruach.org", "https://api.joinruach.org"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply CORS via AWS CLI (Spaces is S3-compatible):

```bash
# Create cors.json with the configuration above

# Apply CORS policy
aws s3api put-bucket-cors \
  --bucket appbuild-logs \
  --cors-configuration file://cors.json \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1
```

---

### 4. Update Environment Variables

Add the following environment variables to your deployment platform:

#### For GitHub Actions (Repository Secrets):

```bash
DO_SPACES_KEY=DO00XXXXXXXXXXXXX
DO_SPACES_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DO_SPACES_BUCKET=appbuild-logs
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

#### For DigitalOcean App Platform:

1. Go to your App in the DigitalOcean dashboard
2. Navigate to Settings > App-Level Environment Variables
3. Add the following variables:

```
BUILD_LOG_BUCKET=appbuild-logs
BUILD_LOG_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_KEY=DO00XXXXXXXXXXXXX
DO_SPACES_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 5. Update Application Configuration

If your application needs to access the build logs bucket programmatically, update the configuration:

#### Add to `.env.production.example`:

```bash
# =============================================================================
# DIGITALOCEAN SPACES (Build Logs)
# =============================================================================

# Build logs storage
DO_SPACES_KEY=__REPLACE_WITH_DO_SPACES_KEY__
DO_SPACES_SECRET=__REPLACE_WITH_DO_SPACES_SECRET__
DO_SPACES_BUCKET=appbuild-logs
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

---

## Verification

### Test Bucket Access

Use the AWS CLI with Spaces endpoints to test:

```bash
# Configure AWS CLI for Spaces
export AWS_ACCESS_KEY_ID="DO00XXXXXXXXXXXXX"
export AWS_SECRET_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# List bucket contents
aws s3 ls s3://appbuild-logs \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1

# Upload a test file
echo "test" > test.txt
aws s3 cp test.txt s3://appbuild-logs/test.txt \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1

# Verify upload
aws s3 ls s3://appbuild-logs/ \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1

# Clean up test file
rm test.txt
aws s3 rm s3://appbuild-logs/test.txt \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1
```

### Test from Application

Create a simple test script to verify connectivity:

```javascript
// test-spaces-connection.js
const AWS = require('aws-sdk');

const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: 'us-east-1'
});

// Test bucket access
s3.listObjects({ Bucket: 'appbuild-logs' }, (err, data) => {
  if (err) {
    console.error('❌ Error accessing bucket:', err.message);
    process.exit(1);
  }
  console.log('✅ Successfully connected to appbuild-logs bucket');
  console.log(`   Objects: ${data.Contents.length}`);
  process.exit(0);
});
```

Run the test:

```bash
node test-spaces-connection.js
```

---

## Bucket Lifecycle Policies

To manage costs, set up lifecycle policies to automatically delete old build logs:

### Policy: Delete logs older than 30 days

```xml
<LifecycleConfiguration>
  <Rule>
    <ID>delete-old-logs</ID>
    <Prefix>logs/</Prefix>
    <Status>Enabled</Status>
    <Expiration>
      <Days>30</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

Apply the policy:

```bash
# Save the policy as lifecycle.xml

aws s3api put-bucket-lifecycle-configuration \
  --bucket appbuild-logs \
  --lifecycle-configuration file://lifecycle.xml \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1
```

---

## Monitoring and Maintenance

### Monitor Storage Usage

```bash
# Check bucket size
doctl spaces list --format Name,Region,Size

# Or via AWS CLI
aws s3 ls s3://appbuild-logs --recursive --summarize \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1
```

### Cost Optimization Tips

1. **Enable lifecycle policies** to automatically delete old logs
2. **Monitor access patterns** - if logs aren't accessed, consider shorter retention
3. **Use bucket analytics** to understand storage patterns
4. **Consider compression** for log files before upload

---

## Troubleshooting

### Error: "NoSuchBucket"

**Cause**: Bucket doesn't exist or wrong region

**Solution**:
```bash
# List all buckets
doctl spaces list

# Create bucket if missing
doctl spaces create appbuild-logs --region nyc3
```

### Error: "Access Denied"

**Cause**: Invalid credentials or insufficient permissions

**Solution**:
1. Verify access keys are correct
2. Check that the Spaces key has read/write permissions
3. Regenerate keys if necessary

### Error: "InvalidAccessKeyId"

**Cause**: Access key is invalid or revoked

**Solution**:
1. Go to DigitalOcean API > Spaces Keys
2. Generate new key
3. Update environment variables
4. Redeploy application

---

## Security Best Practices

1. **Restrict Access**
   - Use separate access keys for different environments (dev, staging, prod)
   - Limit key permissions to only required operations

2. **Enable Access Logs**
   - Monitor who's accessing the bucket
   - Set up alerts for unusual access patterns

3. **Encryption**
   - Enable encryption at rest (done by default with Spaces)
   - Use HTTPS for all transfers

4. **Key Rotation**
   - Rotate access keys every 90 days
   - Document rotation process

5. **Network Security**
   - Consider VPC Peering if your app and Spaces are in the same region
   - Use private endpoints when possible

---

## Additional Resources

- [DigitalOcean Spaces Documentation](https://docs.digitalocean.com/products/spaces/)
- [DigitalOcean CLI (doctl) Guide](https://docs.digitalocean.com/reference/doctl/)
- [AWS S3 CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/) (compatible with Spaces)
- [Spaces API Reference](https://docs.digitalocean.com/reference/api/spaces-api/)

---

## Quick Setup Checklist

- [ ] Create `appbuild-logs` bucket in DigitalOcean Spaces
- [ ] Generate Spaces access keys
- [ ] Configure bucket permissions and CORS
- [ ] Add environment variables to deployment platform
- [ ] Test bucket access with AWS CLI
- [ ] Set up lifecycle policies for log retention
- [ ] Enable monitoring and alerts
- [ ] Document credentials in secure vault

---

**Status**: Ready for deployment after setup completion
