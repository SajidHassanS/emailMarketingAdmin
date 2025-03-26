import User from "./user/user.model.js";
import Admin from "./admin/admin.model.js";
import Password from "./password/password.model.js";
import BlacklistToken from "./admin/blackListToken.model.js";

const models = {
  User,
  Admin,
  Password,
  BlacklistToken,
};

export default models;