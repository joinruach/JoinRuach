# Troubleshooting: Missing Build Bucket Error

## Error Message

```
The build failed due to a missing bucket 'appbuild-logs' which is required for build logs storage.
```

---

## Quick Fix (5 minutes)

### Option 1: Create the Bucket via DigitalOcean Dashboard

1. **Log in to DigitalOcean**
   - Navigate to https://cloud.digitalocean.com/

2. **Create the Bucket**
   - Click "Spaces" in the left sidebar
   - Click "Create Space"
   - Name: `appbuild-logs`
   - Region: Choose closest to your app (e.g., `nyc3`, `sfo3`)
   - Click "Create Space"

3. **Generate Access Keys**
   - Go to API > Spaces Keys
   - Click "Generate New Key"
   - Name: `appbuild-logs-access`
   - Save the **Access Key ID** and **Secret Access Key**

4. **Configure Environment Variables**

   **For GitHub Actions** (Settings > Secrets and variables > Actions):
   ```
   DO_SPACES_KEY=<your-access-key-id>
   DO_SPACES_SECRET=<your-secret-access-key>
   DO_SPACES_BUCKET=appbuild-logs
   DO_SPACES_REGION=nyc3
   ```

   **For DigitalOcean App Platform** (App Settings > Environment Variables):
   ```
   BUILD_LOG_BUCKET=appbuild-logs
   BUILD_LOG_ENDPOINT=https://nyc3.digitaloceanspaces.com
   DO_SPACES_KEY=<your-access-key-id>
   DO_SPACES_SECRET=<your-secret-access-key>
   ```

5. **Redeploy**
   - Trigger a new deployment
   - The build should now succeed with access to the bucket

---

### Option 2: Create the Bucket via CLI

```bash
# Install doctl (if not already installed)
# macOS: brew install doctl
# Linux: wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz

# Authenticate
doctl auth init

# Create the bucket
doctl spaces create appbuild-logs --region nyc3

# Verify creation
doctl spaces list
```

Then follow step 3-5 from Option 1 above.

---

## Verification

Test that the bucket is accessible:

```bash
# Set credentials
export AWS_ACCESS_KEY_ID="your-spaces-key"
export AWS_SECRET_ACCESS_KEY="your-spaces-secret"

# Test access
aws s3 ls s3://appbuild-logs \
  --endpoint-url https://nyc3.digitaloceanspaces.com \
  --region us-east-1
```

Expected output:
```
✅ (empty list if bucket is new, or list of files if logs exist)
```

Error output if bucket doesn't exist:
```
❌ An error occurred (NoSuchBucket) when calling the ListObjectsV2 operation
```

---

## Root Cause

The deployment platform (DigitalOcean App Platform or GitHub Actions) is attempting to upload build logs to a DigitalOcean Spaces bucket named `appbuild-logs`, but this bucket doesn't exist or isn't accessible with the provided credentials.

---

## Prevention

To prevent this error in the future:

1. **Document Infrastructure**
   - Add all required buckets to infrastructure documentation
   - Include bucket creation in deployment runbook

2. **Infrastructure as Code**
   - Consider using Terraform to manage Spaces buckets
   - Example:
     ```hcl
     resource "digitalocean_spaces_bucket" "build_logs" {
       name   = "appbuild-logs"
       region = "nyc3"
     }
     ```

3. **Pre-deployment Checklist**
   - Verify all required buckets exist before deployment
   - Add to DEPLOYMENT_CHECKLIST.md (already done ✅)

4. **Monitoring**
   - Set up alerts for bucket access failures
   - Monitor bucket storage usage

---

## Related Documentation

- [DigitalOcean Spaces Setup Guide](./DIGITALOCEAN_SPACES_SETUP.md) - Complete setup instructions
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
- [DigitalOcean Spaces Docs](https://docs.digitalocean.com/products/spaces/) - Official documentation

---

## Still Having Issues?

### Check these common problems:

1. **Wrong Region**
   - Ensure `DO_SPACES_REGION` matches where the bucket was created
   - Example: If bucket is in `sfo3`, the endpoint should be `https://sfo3.digitaloceanspaces.com`

2. **Invalid Credentials**
   - Verify access keys haven't been revoked
   - Check for typos in environment variables
   - Try regenerating the keys

3. **Permissions Issues**
   - Ensure the Spaces key has read/write permissions
   - Check that the bucket isn't restricted to specific IPs

4. **Bucket Already Exists**
   - Bucket names are globally unique in each region
   - If someone else has `appbuild-logs`, choose a different name like `appbuild-logs-yourorg`

### Need More Help?

- Check build logs for specific error messages
- Review DigitalOcean Spaces dashboard for access logs
- Contact DigitalOcean support if bucket creation fails

---

**Last Updated:** 2025-11-04
**Status:** Active
