"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_service_1 = require("../../config/config.service");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../enum/multer.enum");
const fs_1 = __importDefault(require("fs"));
const global_error_1 = require("../utils/global-error");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    clinet;
    constructor() {
        this.clinet = new client_s3_1.S3Client({
            region: config_service_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_1.AWS_ACCESS_KEY,
                secretAccessKey: config_service_1.AWS_SECRET_ACCESS_KEY,
            },
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
        });
    }
    async uploadFile({ ACL = client_s3_1.ObjectCannedACL.private, file, path = "General", storageType = multer_enum_1.Store_enum.memory, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            ACL,
            Key: `Social_Media_App/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}.`,
            Body: storageType === multer_enum_1.Store_enum.memory
                ? file.buffer
                : fs_1.default.createReadStream(file.path),
            ContentType: file.mimetype,
        });
        if (!command.input.Key) {
            throw new global_error_1.AppError("failed to upload file");
        }
        await this.clinet.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ ACL = client_s3_1.ObjectCannedACL.private, file, path = "General", storageType = multer_enum_1.Store_enum.disk, }) {
        const command = new lib_storage_1.Upload({
            client: this.clinet,
            params: {
                Bucket: config_service_1.AWS_BUCKET_NAME,
                ACL,
                Key: `Social_Media_App/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                Body: storageType === multer_enum_1.Store_enum.memory
                    ? file.buffer
                    : fs_1.default.createReadStream(file.path),
                ContentType: file.mimetype,
            },
        });
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        const result = await command.done();
        if (!result.Key) {
            throw new global_error_1.AppError("failed to upload large file");
        }
        return result.Key;
    }
    async uploadFiles({ ACL = client_s3_1.ObjectCannedACL.private, files, path = "General", storageType = multer_enum_1.Store_enum.memory, isLarge = false, }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ file, storageType, path, ACL });
            }));
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({ file, storageType, path, ACL });
            }));
        }
        return urls;
    }
    async createPreSignedUrl({ path, fileName, ContentType, expiresIn = 60, }) {
        const Key = `Social_Media_App/${path}/${(0, node_crypto_1.randomUUID)()}__${fileName}`;
        let command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
            ContentType,
            ChecksumAlgorithm: undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.clinet, command, { expiresIn });
        return { url, Key };
    }
    async getFile(Key) {
        let command = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
        });
        return await this.clinet.send(command);
    }
    async getPreSignedUrl({ Key, expiresIn = 60, }) {
        let command = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.clinet, command, { expiresIn });
        return url;
    }
    async getFiles(folderName) {
        let command = new client_s3_1.ListObjectsV2Command({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Prefix: `Social_Media_App/${folderName}`,
        });
        return await this.clinet.send(command);
    }
    async deleteFile(Key) {
        let command = new client_s3_1.DeleteObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
        });
        return await this.clinet.send(command);
    }
    async deleteFiles(Keys) {
        let keyMapped = Keys.map((k) => {
            return { Key: k };
        });
        let command = new client_s3_1.DeleteObjectsCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Delete: {
                Objects: keyMapped,
            },
        });
        return await this.clinet.send(command);
    }
    async deleteFolder(folderName) {
        let data = await this.getFiles(folderName);
        if (!data) {
            throw new global_error_1.AppError("no data here");
        }
        let keyMapped = data?.Contents?.map((k) => k.Key).filter(Boolean);
        return await this.deleteFiles(keyMapped);
    }
}
exports.S3Service = S3Service;
