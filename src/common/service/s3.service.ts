import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config/config.service";
import { randomUUID } from "node:crypto";
import { Store_enum } from "../enum/multer.enum";
import fs from "fs";
import { AppError } from "../utils/global-error";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private clinet: S3Client;

  constructor() {
    this.clinet = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  async uploadFile({
    ACL = ObjectCannedACL.private,
    file,
    path = "General",
    storageType = Store_enum.memory,
  }: {
    file: Express.Multer.File;
    storageType?: Store_enum;
    path?: string;
    ACL?: ObjectCannedACL;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      ACL,
      Key: `Social_Media_App/${path}/${randomUUID()}__${file.originalname}.`,
      Body:
        storageType === Store_enum.memory
          ? file.buffer
          : fs.createReadStream(file.path),
      ContentType: file.mimetype,
    });

    if (!command.input.Key) {
      throw new AppError("failed to upload file");
    }

    await this.clinet.send(command);
    return command.input.Key;
  }

  async uploadLargeFile({
    ACL = ObjectCannedACL.private,
    file,
    path = "General",
    storageType = Store_enum.disk,
  }: {
    file: Express.Multer.File;
    storageType?: Store_enum;
    path?: string;
    ACL?: ObjectCannedACL;
  }): Promise<string> {
    const command = new Upload({
      client: this.clinet,
      params: {
        Bucket: AWS_BUCKET_NAME,
        ACL,
        Key: `Social_Media_App/${path}/${randomUUID()}__${file.originalname}`,
        Body:
          storageType === Store_enum.memory
            ? file.buffer
            : fs.createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });

    command.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });
    const result = await command.done();

    if (!result.Key) {
      throw new AppError("failed to upload large file");
    }

    return result.Key as string;
  }

  async uploadFiles({
    ACL = ObjectCannedACL.private,
    files,
    path = "General",
    storageType = Store_enum.memory,
    isLarge = false,
  }: {
    files: Express.Multer.File[];
    storageType?: Store_enum;
    path?: string;
    ACL?: ObjectCannedACL;
    isLarge?: boolean;
  }) {
    let urls: string[] = [];

    if (isLarge) {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadLargeFile({ file, storageType, path, ACL });
        }),
      );
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadFile({ file, storageType, path, ACL });
        }),
      );
    }

    return urls;
  }

  async createPreSignedUrl({
    path,
    fileName,
    ContentType,
    expiresIn = 60,
  }: {
    path?: string;
    fileName?: string;
    ContentType?: string;
    expiresIn?: number;
  }) {
    const Key = `Social_Media_App/${path}/${randomUUID()}__${fileName}`;

    let command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ContentType,
      ChecksumAlgorithm: undefined,
    });

    const url = await getSignedUrl(this.clinet, command, { expiresIn });

    return { url, Key };
  }

  async getFile(Key: string) {
    let command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });

    return await this.clinet.send(command);
  }

  async getPreSignedUrl({
    Key,
    expiresIn = 60,
  }: {
    Key?: string;
    expiresIn?: number;
  }) {
    let command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });

    const url = await getSignedUrl(this.clinet, command, { expiresIn });

    return url;
  }

  async getFiles(folderName: string | undefined) {
    let command = new ListObjectsV2Command({
      Bucket: AWS_BUCKET_NAME,
      Prefix: `Social_Media_App/${folderName}`,
    });

    return await this.clinet.send(command);
  }

  async deleteFile(Key: string) {
    let command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return await this.clinet.send(command);
  }

  async deleteFiles(Keys: string[]) {
    let keyMapped = Keys.map((k) => {
      return { Key: k };
    });
    let command = new DeleteObjectsCommand({
      Bucket: AWS_BUCKET_NAME,
      Delete: {
        Objects: keyMapped,
      },
    });
    return await this.clinet.send(command);
  }

  async deleteFolder(folderName: string) {
    let data = await this.getFiles(folderName);
    if (!data) {
      throw new AppError("no data here");
    }
    let keyMapped = data?.Contents?.map((k) => k.Key).filter(
      Boolean,
    ) as string[];

    return await this.deleteFiles(keyMapped as string[]);
  }
}
