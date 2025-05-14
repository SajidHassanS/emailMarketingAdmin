// config/multer.config.js
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

const storage = multerS3({
  s3: s3Client,
  bucket: process.env.S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    // 1) folder set by middleware: e.g. "static/images/admin/profile-img/<adminUid>"
    const folder = req.storagePath || "static/images/admin";
    // 2) optional filenameBase (if middleware set req.filenameBase)
    let base = req.filenameBase;
    if (!base) {
      const field = file.fieldname || "file";
      const admin = req.adminUid || uuidv4();
      base = `${field}_${admin}_${Date.now()}`;
    }
    // 3) preserve extension
    const fileExt = extname(file.originalname).toLowerCase();
    // 4) final key
    const key = `${folder}/${base}${fileExt}`;
    console.log("→ S3 key:", key);
    cb(null, key);
  },
});

export default multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!/\.(jpe?g|png|gif|webp)$/i.test(file.originalname)) {
      return cb(new Error("Unsupported file format"));
    }
    cb(null, true);
  },
});
