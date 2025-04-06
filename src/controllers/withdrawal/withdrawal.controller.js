import models from "../../models/models.js";
const { Email, Withdrawal } = models;
// Request a withdrawal
export async function requestWithdrawal(req, res) {
  try {
    const { method, phoneNumber } = req.body;
    const userUuid = req.userUid;

    // Check if the user has a default method set
    const defaultMethod = await WithdrawalMethod.findOne({
      where: { userUuid, isDefault: true },
    });

    if (!defaultMethod) {
      return frontError(
        res,
        "No default withdrawal method found. Please add one."
      );
    }

    // If the method is not default, use the provided method
    const methodToUse = method || defaultMethod.methodType;
    const phoneToUse = phoneNumber || defaultMethod.accountNumber;

    // Check if the user has any approved emails for withdrawal
    const availableEmails = await Email.findAll({
      where: { userUuid, status: "good", isWithdrawn: false },
    });

    const totalAmount = availableEmails.reduce((sum, e) => sum + e.amount, 0);

    if (totalAmount === 0) {
      return frontError(res, "No withdrawable amount found.");
    }

    // Create a withdrawal record
    const withdrawal = await Withdrawal.create({
      userUuid,
      amount: totalAmount,
      method: methodToUse,
      phoneNumber: phoneToUse,
    });

    // Mark emails as withdrawn
    await Email.update(
      { isWithdrawn: true },
      { where: { userUuid, status: "good", isWithdrawn: false } }
    );

    return successOk(
      res,
      `Withdrawal of ₨${totalAmount} requested successfully.`,
      withdrawal
    );
  } catch (error) {
    console.log("Error requesting withdrawal:", error);
    return frontError(res, "Failed to request withdrawal.");
  }
}
