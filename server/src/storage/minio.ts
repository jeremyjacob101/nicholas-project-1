import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  describeS3Error,
  getS3ErrorDetails,
  isBucketAlreadyAvailable,
  isBucketNotFound,
} from "./helpers.js";
import "../config.js";

const endpoint = `http://${process.env.APP_HOST}:${process.env.MINIO_API_HOST_PORT}`;
const secretAccessKey = process.env.MINIO_ROOT_PASSWORD!;
const accessKeyId = process.env.MINIO_ROOT_USER!;
const minioBucket = process.env.MINIO_BUCKET!;
const region = process.env.MINIO_REGION!;

const minioClient = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function ensureMinioBucket(): Promise<void> {
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: minioBucket }));
    console.log(`MinIO bucket "${minioBucket}" is ready at ${endpoint}`);
    return;
  } catch (error) {
    const { code, statusCode } = getS3ErrorDetails(error);

    if (!isBucketNotFound(code, statusCode)) {
      throw new Error(
        `Unable to access MinIO bucket "${minioBucket}" (${describeS3Error(error)})`,
      );
    }
  }

  try {
    await minioClient.send(new CreateBucketCommand({ Bucket: minioBucket }));
    console.log(`Created private MinIO bucket "${minioBucket}" at ${endpoint}`);
  } catch (error) {
    const { code, statusCode } = getS3ErrorDetails(error);

    if (isBucketAlreadyAvailable(code, statusCode)) {
      console.log(`MinIO bucket "${minioBucket}" is ready at ${endpoint}`);
      return;
    }

    throw new Error(
      `Unable to create MinIO bucket "${minioBucket}" (${describeS3Error(error)})`,
    );
  }
}
