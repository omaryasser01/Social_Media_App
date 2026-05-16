import multer, { Multer } from "multer";
import { Store_enum, multer_enum } from "../enum/multer.enum";
import { tmpdir } from "node:os";
import { Request } from "express";

const multerCloud = ({
  storageType = Store_enum.memory,
  custom_types = multer_enum.image,
  maxFileSize = 5 * 1024 * 1024,
}: {
  storageType?: Store_enum;
  custom_types?: string[];
  maxFileSize?: number;
} = {}): Multer => {
  const storage =
    storageType === Store_enum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            cb: Function,
          ) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + "-" + file.originalname);
          },
        });

  function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {
    if (!custom_types.includes(file.mimetype)) {
      cb(new Error("invalid file type"));
    }
    cb(null, true);
  }

  const upload: any = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  });
  return upload;
};

export default multerCloud;
