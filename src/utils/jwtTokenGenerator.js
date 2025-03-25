import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/initialConfig.js";

// Function to generate access token
const generateAccessToken = (user) => {
    return jwt.sign({ userUid: user.uuid, token: 'access' }, jwtSecret, {
        expiresIn: "30d",
    });
};

// Function to generate refresh token
const generateRefreshToken = (user) => {
    return jwt.sign({ userUid: user.uuid, token: 'refresh' }, jwtSecret, {
        expiresIn: "120d",
    });
};

// Function to verify refresh token
const verifyRefreshToken = (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, jwtSecret);
        if (decoded.token === 'refresh') return { invalid: false, expired: false, userUid: decoded.userUid };
        return { invalid: true, expired: false };
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return { invalid: false, expired: true };
        }
        return { invalid: true, expired: false };
    }
}

export { generateAccessToken, generateRefreshToken, verifyRefreshToken };
