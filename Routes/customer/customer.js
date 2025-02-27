const express = require('express');
const Customer = require('../../models/Customer');
const { authenticateUser }  = require('../../middleware/authentication');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { createCanvas } = require("canvas");

const generateAvatarImage = (name) => {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext("2d");

  const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FFBB33", "#8E44AD", "#2E86C1"];
  const bgColor = colors[Math.floor(Math.random() * colors.length)];

  // Background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 128, 128);

  // Text settings
  ctx.fillStyle = "#ffffff"; // White text
  ctx.font = "bold 64px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Draw the first letter
  const firstLetter = name.charAt(0).toUpperCase();
  ctx.fillText(firstLetter, 64, 64);

  return canvas.toDataURL(); // Return base64 image
};


// Add Customer
router.post('/addCustomer', authenticateUser, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'All fields are required: customerID, name, phoneNumber' });
    }
    // if(!ByPhoneNumber){
    //   return res.status(402).json({error:'ByPhoneNumber is missing in server'})
    // }

    // Create a new customer

    const profileImage = generateAvatarImage(name); // Generate base64 image

    const customer = new Customer({
      customerID: uuidv4(),
      name,
      phoneNumber,
      ByPhoneNumber: req.ByPhoneNumber,
      userId: req.userId,
      profileImage,

    });

    // Save customer to the database
    await customer.save();

    // Send success response
    res.status(201).json({
      message: 'Customer added successfully',
      customerID: customer.customerID || customer._id, // Use custom ID if available
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to add customer' });
  }
});

// Get all customers for a user

// router.get('/', authenticateUser, async (req, res) => {
//   try {
//     const customers = await Customer.find({ userId: req.userId });
//     res.json(customers);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch customers' });
//   }
// });

module.exports = router;
