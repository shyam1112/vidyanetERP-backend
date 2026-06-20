const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const uploadToS3 = async (file, folder = 'uploads') => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

const deleteFromS3 = async (fileUrl) => {
  if (!fileUrl) return;
  const key = fileUrl.split('.amazonaws.com/')[1];
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = { uploadToS3, deleteFromS3, getPresignedUrl };
