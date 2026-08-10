import {
  describeMinioError,
  isBucketAlreadyAvailable,
} from "./helpers/storage.helper.ts";
import { Client } from "minio";
import "./config.ts";

const endpoint = `http://${process.env.APP_HOST}:${process.env.MINIO_API_HOST_PORT}`;
const secretAccessKey = process.env.MINIO_ROOT_PASSWORD!;
const accessKeyId = process.env.MINIO_ROOT_USER!;
const minioBucket = process.env.MINIO_BUCKET!;
const region = process.env.MINIO_REGION!;

const minioClient = new Client({
  endPoint: process.env.APP_HOST!,
  port: Number(process.env.MINIO_API_HOST_PORT),
  useSSL: false,
  pathStyle: true,
  accessKey: accessKeyId,
  secretKey: secretAccessKey,
  region,
});

export async function uploadMinioObject(
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await minioClient.putObject(minioBucket, objectKey, body, body.length, {
    "Content-Type": contentType,
  });
}

export async function deleteMinioObject(objectKey: string): Promise<void> {
  await minioClient.removeObject(minioBucket, objectKey);
}

export async function ensureMinioBucket(): Promise<void> {
  try {
    const bucketExists = await minioClient.bucketExists(minioBucket);

    if (bucketExists) {
      console.log(`MinIO bucket "${minioBucket}" is ready at ${endpoint}`);
      return;
    }
  } catch (error) {
    throw new Error(
      `Unable to access MinIO bucket "${minioBucket}" (${describeMinioError(error)})`,
    );
  }

  try {
    await minioClient.makeBucket(minioBucket, region);
    console.log(`Created private MinIO bucket "${minioBucket}" at ${endpoint}`);
  } catch (error) {
    if (isBucketAlreadyAvailable(error)) {
      console.log(`MinIO bucket "${minioBucket}" is ready at ${endpoint}`);
      return;
    }

    throw new Error(
      `Unable to create MinIO bucket "${minioBucket}" (${describeMinioError(error)})`,
    );
  }
}
