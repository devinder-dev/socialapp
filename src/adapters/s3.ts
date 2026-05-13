import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!region) throw new Error("Missing S3_REGION");
  if (!accessKeyId) throw new Error("Missing S3_ACCESS_KEY");
  if (!secretAccessKey) throw new Error("Missing S3_SECRET_KEY");

  s3Client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  return s3Client;
}

/*

fullImage
thumbnail
compressed

*/

// type ProfileCard = {
//   id: string;
//   display_name: string;
//   username: string;
//   images: {
//     thumbnail: string;
//     fullImage: string;
//     compressed: string;
//   };
// };

// <img src={profile.images.compressed}>

async function uploadImageToS3(
  imageBuffer: Buffer,
  fullFileName: string,
  contentType: string,
) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("Missing S3_BUCKET");

  const lastDot = fullFileName.lastIndexOf(".");
  const fileExtension = lastDot !== -1 ? fullFileName.slice(lastDot + 1) : "jpg";
  const uniqueName = `${crypto.randomUUID()}.${fileExtension}`;

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: bucket,
      Key: uniqueName,
      Body: imageBuffer,
      ContentType: contentType,
    },
  });

  const result = await upload.done();
  return result.Location;
}

export default uploadImageToS3;
