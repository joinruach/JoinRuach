import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface FileData {
  name: string;
  type: string;
  filepath: string;
}

export const uploadToS3 = async (file: FileData) => {
  try {
    const bucket = process.env.AWS_BUCKET;
    if (!bucket) throw new Error("AWS_BUCKET is not defined");

    const fileExt = path.extname(file.name);
    const fileBaseName = path.basename(file.name, fileExt);
    const safeFileName = `${fileBaseName.replace(/[^a-zA-Z0-9_-]/g, "-")}${fileExt}`;

    const uploadParams = {
      Bucket: bucket,
      Key: `videos/${safeFileName}`,
      Body: fs.createReadStream(file.filepath),
      ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const baseUrl = process.env.AWS_BUCKET_URL_BASE || `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    return {
      file: {
        name: file.name,
        type: file.type,
        url: `${baseUrl}/videos/${safeFileName}`,
      },
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message || error}`);
  }
};
