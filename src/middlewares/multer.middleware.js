// middlewares/multer.middleware.js
import { frontError } from "../utils/responses.js";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import Admin from "../models/admin/admin.model.js";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});
const BUCKET = process.env.S3_BUCKET_NAME;

/**
 * Set the S3 folder for admin profile images:
 *   static/images/admin/profile-img/<adminUid>
 */
export function setProfileImgPath(req, res, next) {
  const adminUid = req.adminUid;
  if (!adminUid) return frontError(res, "Admin UID not found.");
  req.storagePath = `static/images/admin/profile/${adminUid}`;
  next();
}

/**
 * (Optional) If you want a custom filename pattern, e.g. "username_<ts>_profile":
 */
export async function setProfileFilename(req, res, next) {
  const admin = await Admin.findByPk(req.adminUid);
  if (!admin) return frontError(res, "Invalid admin UID.");
  req.filenameBase = `${admin.username || req.adminUid}_${Date.now()}_profile`;
  next();
}

export function setPaymentScreenshotPath(req, res, next) {
  const adminUid = req.adminUid;
  if (!adminUid) return frontError(res, "Admin UID not found.");
  req.storagePath = `static/images/admin/withdrawals/${adminUid}`;
  next();
}

export async function setPaymentScreenshotFilename(req, res, next) {
  const admin = await Admin.findByPk(req.adminUid);
  if (!admin) return frontError(res, "Invalid admin UID.");
  req.filenameBase = `${admin.username || req.adminUid}_${Date.now()}_withdrawal`;
  next();
}