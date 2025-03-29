import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY_ID!,
  },
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const fileName = crypto.randomBytes(16).toString("hex") + "." + file.name.split(".").pop();
  const uploadUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/Posts/${fileName}`;

  await s3.send(new PutObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: `Posts/${fileName}`, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));

  return NextResponse.json({ url: uploadUrl });
}
