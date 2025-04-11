import models from "../models/models.js";
import { hashPassword } from "../utils/passwordUtils.js";
const { Admin } = models;

export const ensureSystemAdminExists = async () => {
    const SYSTEM_ADMIN_UUID = "00000000-0000-0000-0000-000000000001";
    const hashedPassword = await hashPassword("Asdf@1234");

    const existing = await Admin.findByPk(SYSTEM_ADMIN_UUID);
    if (!existing) {
        await Admin.create({
            uuid: SYSTEM_ADMIN_UUID,
            username: "systemadmin",
            password: hashedPassword,
            countryCode: "+92",
            phone: "3123456789",
            role: "superadmin",
            verified: true,
        });

        console.log("✅ System admin created");
    } else {
        console.log("✅ System admin already exists");
    }
};
