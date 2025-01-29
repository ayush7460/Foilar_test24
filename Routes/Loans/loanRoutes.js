const express = require('express');
const multer = require('multer');
const Loan = require('../../models/loans/loanSchema');
const Customer = require('../../models/loans/customer-land');
const path = require('path');
const fs = require('fs');
const { authenticateUser }  = require('../../middleware/authentication');

const router = express.Router();
router.use('/uploads', express.static('uploads'));
// router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));


// Create uploads directory if it doesn't exist
const uploadDirectory = './uploads/';
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Add customer and loan
router.post('/add-loan/:customerID', authenticateUser, upload.single('attachments'), async (req, res) => {
  const { customerID } = req.params;
  const {
    loanType,
    amount,
    interestRate,
    interestFrequency,
    compoundInterest,
    compoundFrequency,
    startDate,
    remarks,
  } = req.body;

  try {
    // Find the customer by customerID
    const customer = await Customer.findOne({ customerID: customerID });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate required fields
    if (!loanType || !amount || !interestRate || !interestFrequency || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const isCompoundInterest = compoundInterest === 'true';

    // Create a new loan linked to the customer
    const loan = await Loan.create({
      customerID: customerID,
      addedBy: req.userId,
      loanDetails: {
        loanType,
        amount,
        interestRate,
        interestStartDate:Date(),
        interestFrequency,
        compoundInterest: {
          enabled: isCompoundInterest,
          frequency: isCompoundInterest ? compoundFrequency : null,
        },
        startDate,
        attachments: req.file ? [`/uploads/${req.file.filename}`] : [],
        remarks,
        
        
      },
    });

    res.status(201).json({ message: 'Loan added successfully', loan });
  } catch (error) {
    console.error('Error adding loan:', error);
    res.status(500).json({ message: 'Error Adding loan', error });
  }
});

// Get all loans
router.get('/loan-profile/:customerID', async (req, res) => {
  const { customerID } = req.params;

  try {
    const loan = await Loan.findOne({ customerID: customerID }).populate('customerID'); // Use populate if ref is added
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// const multer = require('multer');
const uploads = multer({ storage: storage });

router.post('/loan-profile/:customerID/signature', upload.single('attachments'), async (req, res) => {
  const { customerID } = req.params;
  try {
    // const { customerID } = req.params;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Uploaded File Path:', filePath); // Debug

    if (!filePath) {
      return res.status(400).send({ message: 'No file uploaded.' });
    }
    const attachmentEntry = {
      path: filePath,
      date: new Date(), // Automatically set the current date
    };

    const loan = await Loan.findOneAndUpdate(
      { customerID },
      { $push: { "loanDetails.signature": attachmentEntry } }, // Ensure the correct path is used
      { new: true }
    );

    if (!loan) {
      return res.status(404).send({ message: 'Loan not found.' });
    }

    console.log('Updated Loan:', loan); // Debug

    res.status(200).send(loan);
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).send({ message: 'Error saving signature.' });
  }
});

router.put('/billNo/:customerID', async (req, res) => {  
  const { customerID } = req.params;  
  const { billNumber } = req.body;  

  try {  
    const loan = await Loan.findOneAndUpdate(  
      { customerID },  
      { $set: { "loanDetails.billNo": billNumber } }, // Adjust the path based on your schema  
      { new: true }  
    );  
    
    if (!loan) {  
      return res.status(404).send({ message: 'Loan not found.' });  
    }  

    res.status(200).send(loan);  
  } catch (error) {  
    console.error('Error updating loan:', error);  
    res.status(500).send({ message: 'Error updating loan.' });  
  }  
});  

// Endpoint to calculate totals
router.get('/total-amount', authenticateUser, async (req, res) => {
  try {
    // Aggregate People Owe (loans given)
    const peopleOweTotal = await Loan.aggregate([
      {
        $match: { 
          addedBy: req.userId
         }, // Example condition, adjust based on schema
      },
      {
        $group: {
          _id: null,
          totalAmount: { 
            
            $sum: '$loanDetails.amount' },
        },
      },
    ]);

    // Aggregate You Owe (loans taken)
    const youOweTotal = await Loan.aggregate([
      {
        $match: { 
          loanType: 'You Owe',
          addedBy: req.userId
         }, // Example condition, adjust based on schema
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$loanDetails.amount' },
        },
      },
    ]);

    res.json({
      peopleOwe: peopleOweTotal[0]?.totalAmount || 0,
      youOwe: youOweTotal[0]?.totalAmount || 0,
      userId: req.userId,
    });
  } catch (error) {
    console.error('Error calculating totals:', error);
    res.status(500).json({ message: 'Error calculating totals', error });
  }
});


module.exports = router;
