const express = require('express');
const Loan = require('../../models/loans/loanSchema'); // Adjust path as needed
const LoanProfile = require('../../models/loans/customer-land');
const { authenticateUser }  = require('../../middleware/authentication');
const router = express.Router();
const schedule = require('node-schedule');


// Fetch loan details by ID
router.get('/loan-profile/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerID'); // Use populate if ref is added
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/loan-profile2/:customerID', async (req, res) => {
  const { customerID } = req.params;

  try {
    const loan = await LoanProfile.findOne({ customerID: customerID }).populate('customerID'); // Use populate if ref is added
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/transactions_loan', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId
    // Fetch all transactions added by the authenticated user
    
    const transactions = await Loan.find({ addedBy: req.userId }).sort({ createdAt: -1 });
    const profile = await LoanProfile.find({ ByPhoneNumber: req.ByPhoneNumber }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: transactions,
      profile1: profile,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions', error });
  }
});

router.put('/update-transaction-status/:transactionId', async (req, res) => {
  try {
    const transaction = await Loan.findOne({ customerID: req.params.transactionId });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    transaction.status = req.body.status; // Use the status from the request body
    await transaction.save();

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: 'Error updating transaction status' });
  }
});


router.put('/transactions-loan/stop-interest/:transactionId', async (req, res) => {
  try {
    const transaction = await Loan.findOne({ customerID: req.params.transactionId });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    transaction.loanDetails.accruedInterest = 0; // Reset interest
    transaction.loanDetails.interestStartDate = new Date(); 
    console.log('Transaction Before Save:', transaction);
    await transaction.save();
    console.log('Transaction After Save:', transaction);
    res.json({ message: 'Interest calculation stopped successfully' });
  } catch (error) {
    console.error('Error stopping interest:', error);
    res.status(500).json({ message: 'Error stopping interest' });
  }
});

router.get('/search/transactions', authenticateUser, async (req, res) => {
  try {
    const { mobileNumber } = req.query;
    const userId = req.ByPhoneNumber; // Extract user ID from authenticated user

    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    const transactions = await LoanProfile.find({
      'phoneNumber': mobileNumber, // Match by phone number
      ByPhoneNumber: userId, // Match by the user who added the transaction
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error searching transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const calculateDailyInterest = (amount, interestRate) => {
  const dailyRate = (interestRate / 100) / 30; // Daily interest rate
  return dailyRate * amount;
};


// function calculateCompoundInterest(principal, rate, startDate, frequency) {
//   const today = new Date();
//   const start = new Date(startDate);
//   const monthsElapsed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  
//   const n = frequency === 'Monthly' ? 12 : frequency === 'Quarterly' ? 4 : frequency === 'Half-Yearly' ? 2 : 1; // Compounding times per year
//   const timePeriods = monthsElapsed / (12 / n); // Convert months to compounding periods
//   const compoundRate = rate / (100 * n);
  
//   return principal * Math.pow(1 + compoundRate, timePeriods) - principal;
// }

function calculateAccruedInterest(amount, rate, startDate) {
  const today = new Date();
  const start = new Date(startDate);
  const daysElapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const dailyRate = rate / 100 / 365; // Assumes annual rate divided by days in a year
  return amount * dailyRate * daysElapsed;
}

// const calculateAccruedInterest = (amount, interestRate, startDate) => {
//   const today = new Date();
//   const start = new Date(startDate);
//   const elapsedDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)); // Days since startDate
//   const dailyInterest = calculateDailyInterest(amount, interestRate);
//   return dailyInterest * elapsedDays;
// };

// API to update interest
router.put('/update-interest/:customerID', async (req, res) => {
  try {
    const loan = await Loan.findOne({ customerID: req.params.customerID });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const accruedInterest = calculateAccruedInterest(
      loan.loanDetails.amount,
      loan.loanDetails.interestRate,
      loan.loanDetails.startDate
    );
    const totalAmount = loan.loanDetails.amount + accruedInterest;

    // Update loan details
    loan.loanDetails.accruedInterest = accruedInterest;
    loan.loanDetails.totalAmount = totalAmount;
    loan.updatedAt = new Date();

    await loan.save();

    res.json({ message: 'Interest updated successfully', loan });
  } catch (error) {
    console.error('Error updating interest:', error);
    res.status(500).json({ message: 'Error updating interest', error });
  }
});



schedule.scheduleJob('0 0 * * *', async () => {
  console.log('Running scheduled interest update...');
  try {
    const loans = await Loan.find({ 'loanDetails.interestMethod': 'Simple', status: 'active' });

    for (const loan of loans) {
      const { amount, interestRate, startDate } = loan.loanDetails;
      const accruedInterest = calculateAccruedInterest(amount, interestRate, startDate);
      const totalAmount = amount + accruedInterest;

      loan.loanDetails.accruedInterest = accruedInterest;
      loan.loanDetails.totalAmount = totalAmount;
      loan.updatedAt = new Date();

      await loan.save();
    }

    console.log('Interest updated successfully for all loans.');
  } catch (err) {
    console.error('Error updating interest:', err);
  }
});


// Top-Up Endpoint
router.put('/top-up/:customerID', async (req, res) => {
  const { customerID } = req.params;
  const { topUpAmount } = req.body;

  if (!topUpAmount || topUpAmount <= 0) {
    return res.status(400).json({ error: 'Invalid top-up amount.' });
  }

  try {
    // Find the loan details by customer ID
    const loan = await Loan.findOne({ customerID: customerID }).populate('customerID');
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    // Update the loan amount (add top-up amount)
    loan.loanDetails.amount += parseFloat(topUpAmount);

    // Recalculate total amount and interest (if needed)
    const { amount, interestRate, startDate } = loan.loanDetails;
    const today = new Date();

    // Calculate accrued interest
    const elapsedDays = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const dailyRate = interestRate / 100 / 30; // Assuming 30 days in a month
    const accruedInterest = dailyRate * amount * elapsedDays;

    // Update loan details
    loan.loanDetails.accruedInterest = accruedInterest;
    loan.loanDetails.totalAmount = amount + accruedInterest;

    // Save updated loan details
    await loan.save();

    res.json(loan); // Send updated loan details as response
  } catch (err) {
    console.error('Error processing top-up:', err);
    res.status(500).json({ error: 'Failed to process top-up. Please try again.' });
  }
});


module.exports = router;
