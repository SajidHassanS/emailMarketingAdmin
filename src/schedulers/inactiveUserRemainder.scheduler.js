// src/schedulers/inactivityReminder.js
import cron from 'node-cron';
import { Op } from 'sequelize';
import User from '../models/user/user.model.js';
import Email from '../models/email/email.model.js';
import Admin from '../models/admin/admin.model.js';
import { createNotification } from '../utils/notificationUtils.js';
import { saveMessageToDB } from '../utils/messageUtils.js'

// 1a) the pure job
export async function runInactivityReminder() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 10);

  // fetch users + last email timestamps
  const users = await User.findAll({
    include: [{ model: Email, as: "emails", attributes: ['createdAt'] }],
  });

  const inactive = users.filter((u) => {
    if (u.emails.length === 0) return true;
    const last = u.emails
      .map((e) => e.createdAt)
      .sort((a, b) => b - a)[0];
    return last < cutoff;
  });

  console.log("==================================================")
  console.log("==================================================")
  console.log("===== inactive ===== : ", inactive)
  console.log("==================================================")
  console.log("==================================================")

  if (!inactive.length) {
    console.log('Inactivity reminder: no one to ping.');
    return;
  }

  const systemAdmin =
    (await Admin.findOne({ where: { username: 'systemadmin' } })) ||
    (await Admin.findOne());

  for (const u of inactive) {
    await createNotification({
      userUuid: u.uuid,
      title: 'We miss you!',
      message:
        `Hi ${u.username}, it’s been a while since we last saw you. Log back in to keep growing your balance and stay on top of your earnings.`,
      type: 'info',
    });
    if (systemAdmin) {
      await saveMessageToDB({
        senderUuid: systemAdmin.uuid,
        senderType: 'admin',
        receiverUuid: u.uuid,
        receiverType: 'user',
        content:
          `Hello ${u.username}, We noticed you haven't uploaded any emails in a while. Remember: the more you upload, the more you earn! Log back in today to see what you’ve missed.`,
        isNotification: true,
      });
    }
  }

  console.log(`Inactivity reminder: pinged ${inactive.length} users.`);
}

// 1b) schedule it
cron.schedule(
  '0 15 * * *',
  runInactivityReminder,
  { scheduled: true, timezone: 'Asia/Karachi' }
);

// nothing else to export
