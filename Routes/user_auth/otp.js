// server.js or twilioOtpRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const jwtSecret = process.env.JWT_SECRET;

const client = require('twilio')(accountSid, authToken);

// 1️⃣ Send OTP using Twilio
router.post('/send-otp', async (req, res) => {
  const { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: `+91${mobileNumber}`,
        channel: 'sms',
      });

    res.status(200).json({ message: 'OTP sent successfully', status: verification.status });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// 2️⃣ Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required' });
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: `+91${mobileNumber}`,
        code: otp,
      });

    if (verificationCheck.status === 'approved') {
      const user = await User.findOne({ mobileNumber });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const token = jwt.sign(
        { userId: user.userId, mobileNumber: user.mobileNumber },
        jwtSecret,
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'OTP verified successfully', token });
    } else {
      res.status(401).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

// 3️⃣ Forget Password OTP Verification
router.post('/forget-password/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: `+91${mobileNumber}`,
        code: otp,
      });

    if (verificationCheck.status === 'approved') {
      res.status(200).json({ message: 'OTP verified successfully' });
    } else {
      res.status(401).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// 4️⃣ Reset Password
router.post('/reset-password', async (req, res) => {
  const { mobileNumber, newPassword } = req.body;

  const user = await User.findOne({ mobileNumber });
  if (!user) return res.status(404).json({ message: "User not found" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
});

module.exports = router;



// // server.js
// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// require('dotenv').config();
// const bcrypt = require('bcrypt');
// const User = require('../../models/user');
// const jwt = require('jsonwebtoken');
// const jwtSecret = process.env.JWT_SECRET || 'anykey';


// const FAST2SMS_API_KEY = "rXWbJda2A3hn507E9CTUBPZq8LNemHtsYfgDc164GRFjwyOpQuKarWg7vMIA3fRtFPYZysh1UweXJNmS" ;

// // Temporary storage for OTPs
// const otpStore = {};

// // Endpoint to send OTP
// router.post('/send-otp', async (req, res) => {
//   const { mobileNumber } = req.body;

//   if (!mobileNumber) {
//     return res.status(400).json({ message: 'Phone number is required' });
//   }
//   // console.log('API Key:', FAST2SMS_API_KEY);

//   const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
//   otpStore[mobileNumber] = otp; // Store OTP temporarily

//   try {
//     const response = await axios.post(
//       'https://www.fast2sms.com/dev/bulkV2',
//       {
//         // sender_id: 'lwdtp7cjyqxvfe9',
//         message: `Your OTP is ${otp}. Please do not share it with anyone.`,
//         language: 'english',
//         variables_values: otp,
//         route: "otp",
//         numbers: mobileNumber,
//         flash : "0"
//       },
//       {
//         headers: {
//           authorization: FAST2SMS_API_KEY,
//         },
//       }
//     );

//     res.status(200).json({ message: 'OTP sent successfully', otp }); // otp included for testing
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to send OTP server', error: error.message });
//     console.error('otp server fail');
//   }
// });

// // Endpoint to verify OTP
// router.post('/verify-otp', async(req, res) => {
//   const { mobileNumber, otp } = req.body;

//   if (!mobileNumber || !otp) {
//     return res.status(400).json({ message: 'Phone number and OTP are required' });
//   }

//   const user = await User.findOne({ mobileNumber });
//   if (!user) {
//     return res.status(404).json({ message: 'User not found' });
//   }

//   const token = jwt.sign({userId: user.userId, mobileNumber: user.mobileNumber}, jwtSecret, { expiresIn: '1h' });

//   if (otpStore[mobileNumber] && otpStore[mobileNumber] == otp.toString()) {
//     delete otpStore[mobileNumber]; // Remove OTP after successful verification
//     res.status(200).json({ message: 'OTP verified successfully', token });
//   } else {
//     res.status(401).json({ message: 'Invalid OTP' });
//   }
// });
// // 2️⃣ Verify OTP

// router.post('/forget-password/verify-otp', async (req, res) => {
//   const { mobileNumber, otp } = req.body;

//   if (otpStore[mobileNumber] == otp.toString()) {
//     delete otpStore[mobileNumber]; // Remove OTP after successful verification
//     res.status(200).json({ message: "OTP verified successfully" });
//   } else {
//     res.status(401).json({ message: "Invalid OTP" });
//   }
// });

// // 3️⃣ Reset Password
// router.post('/reset-password', async (req, res) => {
//   const { mobileNumber, newPassword } = req.body;
  
//   const user = await User.findOne({ mobileNumber });
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const hashedPassword = await bcrypt.hash(newPassword, 10);


//   user.password = hashedPassword; // Save new password (should be hashed)
//   await user.save();

//   res.status(200).json({ message: "Password reset successfully" });
// });



// module.exports = router;

