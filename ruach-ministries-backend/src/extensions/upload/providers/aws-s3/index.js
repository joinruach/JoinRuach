const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

module.exports = {
  init: async (config) => {
    // Initialize the S3 instance with AWS SDK
    const s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region,
    });

    return {
      upload: async (file) => {
        const filePath = file.path || path.join(__dirname, '..', '..', file.filename);
        const fileStream = fs.createReadStream(filePath);

        const uploadParams = {
          Bucket: config.bucketName,
          Key: `uploads/${file.hash}${file.ext}`,
          Body: fileStream,
          ContentType: file.mime,
          // ❌ Removed ACL: 'public-read'
        };

        try {
          const data = await s3.upload(uploadParams).promise();

          return {
            url: data.Location, // Direct link to S3 object
            provider_metadata: {
              bucket: data.Bucket,
              key: data.Key,
            },
          };
        } catch (err) {
          console.error('❌ S3 Upload Error:', err);
          throw new Error(`S3 Upload Failed: ${err.message}`);
        }
      },

      delete: async (file) => {
        const deleteParams = {
          Bucket: config.bucketName,
          Key: `uploads/${file.hash}${file.ext}`,
        };

        try {
          await s3.deleteObject(deleteParams).promise();
          return { message: '✅ File deleted successfully from S3' };
        } catch (err) {
          console.error('❌ S3 Delete Error:', err);
          throw new Error(`S3 Delete Failed: ${err.message}`);
        }
      },
    };
  },
};
