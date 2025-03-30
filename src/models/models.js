import User from "./user/user.model.js";
import Admin from "./admin/admin.model.js";
import Password from "./password/password.model.js";
import BlacklistToken from "./admin/blackListToken.model.js";
import Email from "./email/email.model.js";

const models = {
  User,
  Admin,
  Email,
  Password,
  BlacklistToken,
};

export default models;
