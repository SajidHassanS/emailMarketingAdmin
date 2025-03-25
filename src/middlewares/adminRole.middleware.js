import Admin from "../models/admin/admin.model.js";
import {
    forbiddenError,
    frontError,
} from "../utils/responses.js";

export const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const adminUid = req.admin.uuid;

            const admin = await Admin.findByPk(adminUid)
            if (!admin) return frontError(res, "Invalid token.")

            const role = admin.role

            // Check if the admin's role is in the allowed roles list
            if (!allowedRoles.includes(role)) return forbiddenError(res, "")

            next(); // Proceed if role is authorized
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
};
