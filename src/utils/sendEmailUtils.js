import { transporter } from "../config/emailConfig.js";

export const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP Verification',
            // text: `Your OTP is ${otp}.`
            html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #007bff;">Your OTP Code</h2>
                        <p style="font-size: 16px;">Your OTP is: <strong style="font-size: 20px; color: #007bff;">${otp}</strong></p>
                        <p>This OTP is valid for 1 minutes. Please enter it as soon as possible to proceed with your password reset.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                `
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent successfully to ${email}`);
        return true; // Return true if email sent successfully
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        return false; // Return false if email sending failed
    }
};