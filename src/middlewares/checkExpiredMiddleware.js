import Contract from "../models/contractFarming/contract.model.js";

import { Op } from "sequelize";

export const checkExpiredContracts = async (req, res, next) => {
  try {
    const today = new Date(); // Get current date

    // ✅ Find contracts that have passed their end date but are still marked as active/approved
    const expiredContracts = await Contract.findAll({
      where: {
        end_date: { [Op.lt]: today }, // End date is before today
        status: { [Op.in]: ["active", "approved"] }, // Only check active/approved contracts
      },
    });

    // ✅ Update each expired contract to "expired"
    for (const contract of expiredContracts) {
      contract.status = "expired";
      await contract.save();
    }

    next(); // Move to the next middleware/controller
  } catch (error) {
    console.error("Error checking expired contracts:", error);
    return res.status(500).json({ error: error.message });
  }
};
