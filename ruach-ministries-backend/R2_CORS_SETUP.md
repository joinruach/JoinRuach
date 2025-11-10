# Cloudflare R2 CORS Configuration

To enable direct uploads from the browser to R2, you need to configure CORS rules on your R2 bucket.

## Required CORS Configuration

Add the following CORS rule to your R2 bucket via the Cloudflare dashboard:

```json
[
  {
    "AllowedOrigins": [
      "https://joinruach.org",
      "https://www.joinruach.org",
      "http://localhost:3000",
      "http://localhost:1337"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## How to Apply CORS Configuration

### Method 1: Using Wrangler CLI (Recommended)

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Create CORS configuration file** (`cors.json`):
   ```bash
   cat > cors.json << 'EOF'
   [
     {
       "AllowedOrigins": [
         "https://joinruach.org",
         "https://www.joinruach.org",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   EOF
   ```

4. **Apply CORS to your R2 bucket**:
   ```bash
   wrangler r2 bucket cors put YOUR_BUCKET_NAME --cors-config cors.json
   ```

5. **Verify CORS configuration**:
   ```bash
   wrangler r2 bucket cors get YOUR_BUCKET_NAME
   ```

### Method 2: Using Cloudflare Dashboard

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Your Bucket**
3. Click on **Settings**
4. Scroll to **CORS Policy**
5. Add the CORS configuration JSON above
6. Click **Save**

## Testing CORS Configuration

You can test CORS using curl:

```bash
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com/YOUR_BUCKET_NAME/test.txt
```

Expected response headers:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
Access-Control-Allow-Headers: *
```

## Common Issues

### Issue 1: CORS Policy Not Applied

**Symptom**: Browser shows CORS errors like "No 'Access-Control-Allow-Origin' header"

**Solution**:
- Wait a few minutes for CORS policy to propagate
- Verify CORS configuration using `wrangler r2 bucket cors get YOUR_BUCKET_NAME`
- Check that your domain is listed in AllowedOrigins

### Issue 2: Presigned URL Not Working

**Symptom**: Upload fails with 403 Forbidden

**Solution**:
- Verify R2 credentials in `.env` file
- Check that R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY are set correctly
- Ensure presigned URL hasn't expired (default: 1 hour)

### Issue 3: Upload Succeeds but File Not Accessible

**Symptom**: File uploads but can't be accessed via public URL

**Solution**:
- Enable public access on your R2 bucket
- Set up a custom domain for R2 bucket
- Update `UPLOAD_CDN_URL` in `.env` to point to your R2 public URL

## Environment Variables

Make sure these are set in `ruach-ministries-backend/.env`:

```env
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
UPLOAD_CDN_URL=https://cdn.joinruach.org
```

## Security Notes

- **AllowedOrigins**: In production, remove localhost origins and only allow your production domains
- **AllowedHeaders**: Consider restricting to specific headers instead of using "*"
- **Authentication**: Enable authentication on presigned upload endpoints in production
- **Rate Limiting**: Implement rate limiting to prevent abuse

## Next Steps

After configuring CORS:

1. Restart your Strapi backend
2. Test upload using the example component
3. Monitor R2 usage in Cloudflare dashboard
4. Set up CDN domain for faster downloads
5. Configure lifecycle policies for old files (optional)
