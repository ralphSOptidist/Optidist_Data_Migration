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

export const transferImage = async (key: string, newKey: string) => {
  try {
    console.log(`Attempting to download object with key: ${key}`);

    const objectData = await sourceS3
      .getObject({
        Bucket: "optidist",
        Key: key,
      })
      .promise();

    console.log(`Downloaded object: ${key}`);

    await targetS3
      .upload({
        Bucket: "optidist-staging",
        Key: newKey,
        Body: objectData.Body as Readable,
        ContentType: objectData.ContentType,
        ACL: "public-read-write",
      })
      .promise();

    console.log(`Uploaded object to new bucket: ${newKey}`);
  } catch (error: any) {
    console.error(
      `Failed to transfer object. Bucket: "optidist", Key: ${key}, Error: ${error.message}`
    );

    if (error.code === "NoSuchKey") {
      console.error(`Key "${key}" does not exist in the source bucket.`);
    }
  }
};
