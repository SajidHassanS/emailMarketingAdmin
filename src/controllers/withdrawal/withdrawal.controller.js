import models from "../../models/models.js";
const { Email, Withdrawal, WithdrawalMethod } = models;
// Request a withdrawal
export async function requestWithdrawal(req, res) {
  try {
    const userUuid = req.userUid;
    const { method } = req.body; // Optional: methodType to override default

    // Fetch user's default withdrawal method
    const defaultMethod = await WithdrawalMethod.findOne({
      where: { userUuid, isDefault: true },
    });

    if (!defaultMethod) {
      return frontError(
        res,
        "No default withdrawal method found. Please add one."
      );
    }

    let methodToUse = defaultMethod;

    // If user provided a methodType, use it instead
    if (method) {
      const providedMethod = await WithdrawalMethod.findOne({
        where: { userUuid, methodType: method },
      });

      if (!providedMethod) {
        return frontError(res, "Specified withdrawal method not found.");
      }

      methodToUse = providedMethod;
    }

    // Get all eligible emails for withdrawal
    const availableEmails = await Email.findAll({
      where: { userUuid, status: "good", isWithdrawn: false },
    });

    const totalAmount = availableEmails.reduce((sum, email) => sum + email.amount, 0);

    if (totalAmount === 0) {
      return frontError(res, "No withdrawable amount found.");
    }

    // Create the withdrawal record using withdrawalMethodUuid
    const withdrawal = await Withdrawal.create({
      userUuid,
      withdrawalMethodUuid: methodToUse.uuid,
      amount: totalAmount,
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
    console.error("Error requesting withdrawal:", error);
    return frontError(res, "Failed to request withdrawal.");
  }
}

