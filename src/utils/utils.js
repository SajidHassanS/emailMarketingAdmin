import os from 'os';

// ============================ getRelativePath =================================

// Helper function to get the relative path from the static base path
const getRelativePath = (fullPath) => {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    const index = normalizedPath.indexOf('/static');
    if (index === -1) return '';
    return normalizedPath.substring(index);
}

// =========================== convertToLowercase ===============================

const convertToLowercase = (obj, excludeFields = []) => {
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string' && !excludeFields.includes(key)) {
                newObj[key] = value.toLowerCase();
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};

// ============================ validateEmail ====================================

const validEmailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const validateEmail = (email) => {
    if (!email) {
        return "Email is required";
    }
    if (!validEmailRegex.test(email)) {
        return "Please enter a valid email";
    }
};

// ========================== validateCountryCode ================================

const validateCountryCode = (countryCode) => {
    if (!countryCode) return "Country code is required";
    if (!/^\+\d{1,4}$/.test(countryCode)) return "Invalid country code format. Example: +92";
    return null;
};

// ============================ validatePhone ====================================

const validatePhone = (phone) => {
    if (!phone) return "Phone number is required";
    if (/^0/.test(phone)) return "Phone number should not start with 0. Example: 3312345678";
    if (!/^\d{10}$/.test(phone)) return "Phone number must be exactly 10 digits long";
    return null;
};

// ============================ validateUsername ==================================

const validateUsername = (username) => {
    if (!username) return "Username is required.";

    // Check length (3 to 20 characters)
    if (username.length < 3 || username.length > 20) return "Username must be between 3 and 20 characters long.";

    // Check if it starts with a letter
    if (!/^[a-zA-Z]/.test(username)) return "Username must start with a letter.";

    // Check for spaces
    if (/\s/.test(username)) return "Username cannot contain spaces.";

    // Check for valid characters (letters, numbers, underscores, and dots)
    if (!/^[a-zA-Z0-9._]+$/.test(username)) return "Username can only contain letters, numbers, underscores (_), and dots (.)";
    return null; // Valid username
}

// ============================ getIPAddress =================================

// Function to get the IP address of the server
function getIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0'; // fallback in case IP address cannot be determined
}

// ============================ createTodayDateWithAddDays =================================

const createTodayDateWithAddDays = (daysToAdd) => {
    let today = new Date();

    // Create a new Date object with added days from today
    let daysToAddDate = new Date();
    daysToAddDate.setDate(today.getDate() + daysToAdd);

    // Format the dates as strings (optional)
    return daysToAddDate.toISOString().split("T")[0];
};


// ============================ check31DaysExpiry =================================


function check31DaysExpiry(activationDate) {
    const today = new Date();
    const activeDate = new Date(activationDate);

    // Add 31 days to the activation date
    const activeDatePlus31 = new Date(activeDate);
    activeDatePlus31.setDate(activeDatePlus31.getDate() + 31);

    // Calculate the difference in time
    const timeDifference = activeDatePlus31 - today;

    // Calculate the remaining days
    const remainingDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    // Check if today's date is past the 31-day period
    const expired = timeDifference <= 0;

    return {
        expired,
        remainingDays: expired ? 0 : remainingDays
    };
}


// ============================ capitalizeWords =================================


const capitalizeWords = (wordString) => {
    wordString = wordString.toLowerCase();
    let words = wordString.split(" ");
    let capitaleWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    return capitaleWords.join(" ");
};


export { convertToLowercase, validateEmail, validateCountryCode, validatePhone, validateUsername, getIPAddress, getRelativePath, createTodayDateWithAddDays, capitalizeWords, check31DaysExpiry };
