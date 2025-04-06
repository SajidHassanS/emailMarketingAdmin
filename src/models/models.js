import User from "./user/user.model.js";
import Admin from "./admin/admin.model.js";
import Password from "./password/password.model.js";
import BlacklistToken from "./admin/blackListToken.model.js";
import Email from "./email/email.model.js";
import DuplicateEmail from "./email/duplicateEmail.model.js";
import Notification from "./notification/notification.model.js";
import SystemSetting from "./systemSetting/systemSetting.model.js";
import Withdrawal from "./withdrawal/withdarwal.model.js";

const models = {
  User,
  Admin,
  Email,
  Password,
  Notification,
  BlacklistToken,
  DuplicateEmail,
  SystemSetting,
  Withdrawal,
};

export default models;
