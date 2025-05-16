import User from "./user/user.model.js";
import Admin from "./admin/admin.model.js";
import Password from "./password/password.model.js";
import BlacklistToken from "./admin/blackListToken.model.js";
import Email from "./email/email.model.js";
import DuplicateEmail from "./email/duplicateEmail.model.js";
import Notification from "./notification/notification.model.js";
import SystemSetting from "./systemSetting/systemSetting.model.js";
import Withdrawal from "./withdrawal/withdarwal.model.js";
import WithdrawalMethod from "./withdrawal/withdrawalMethod.model.js";
import Bonus from "./withdrawal/bonus.model.js";
import BonusWithdrawal from "./withdrawal/bonusWithdrawal.model.js";
import Message from "./message/message.model.js";
import Phone from "./user/phone.model.js";
import MarqueeMessage from "./marquee/marquee.model.js";
import FAQ from "./faq/faq.model.js";

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
  WithdrawalMethod,
  Bonus,
  BonusWithdrawal,
  Message,
  Phone, // user phone model
  MarqueeMessage,
  FAQ,
};

export default models;
