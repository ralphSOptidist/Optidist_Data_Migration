import AWS from "aws-sdk";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();
// Configure the source S3 client
const sourceS3 = new AWS.S3({
  endpoint: process.env.FROM_SPACES_ENDPOINT,
  accessKeyId: process.env.FROM_SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.FROM_SPACES_SECRET_ACCESS_KEY,
  region: process.env.FROM_SPACES_REGION,
});

// Configure the target S3 client
const targetS3 = new AWS.S3({
  endpoint: process.env.TO_SPACES_ENDPOINT,
  accessKeyId: process.env.TO_SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.TO_SPACES_SECRET_ACCESS_KEY,
  region: process.env.TO_SPACES_REGION,
});

export const transferImage = async (key: string) => {
  try {
    const objectData = await sourceS3
      .getObject({
        Bucket: "optidist-dev",
        Key: key,
      })
      .promise();

    console.log(`Downloaded object: ${key}`);

    await targetS3
      .upload({
        Bucket: "optidist-staging",
        Key: key,
        Body: objectData.Body as Readable,
        ContentType: objectData.ContentType,
      })
      .promise();

    console.log(`Uploaded object to new bucket: ${key}`);
  } catch (error) {
    console.error(`Failed to transfer ${key}:`, error);
  }
};

const transferImages = async (keys: string[]) => {
  for (const key of keys) {
    await transferImage(key);
  }
};
