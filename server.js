const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const { v4: uuidv4 } = require('uuid');

const signup = require('./Routes/user_auth/signup');
const login = require('./Routes/user_auth/login');
const otp = require('./Routes/user_auth/otp');
const profile = require('./Routes/user_auth/profile');
const customer = require('./Routes/customer/customer');
const supplier = require('./Routes/supplier/supplier');
const suppconnect = require('./Routes/supplier/supp-connect');
const transactions = require('./Routes/customer/transaction');
const chat = require('./Routes/customer/chat');
const c_detail = require('./Routes/customer/C_detail')
const s_detail = require('./Routes/supplier/S_detail');
const seebycustomer = require('./Routes/look_by_customer/see_by_customer')
const connect = require('./Routes/look_by_customer/connect');
const loanRoutes = require('./Routes/Loans/loanRoutes');
const loanProfile = require('./Routes/Loans/loan-profile');
const add = require('./Routes/Loans/add');
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(cors({ origin: 'http://localhost:3000' }));
mongoose.set('debug', true);

app.use('/api', signup);
app.use('/api', login);  
app.use('/api', otp);
app.use('/api', profile);
app.use('/api', c_detail);
app.use('/api', s_detail);
app.use('/api', customer);
app.use('/api', transactions);
app.use('/api', chat);

app.use('/api', supplier);
app.use('/api', suppconnect);

app.use('/api', seebycustomer);
app.use('/api', connect);

app.use('/api', add);
app.use('/api', loanRoutes);
app.use('/api', loanProfile);



let customers = [];
let suppliers = [];

// Connect to MongoDB mongodb+srv://ad:a1y2u3@cluster0.y0axid7.mongodb.net
// mongoose.connect('mongodb+srv://ad:a1y2u3@cluster0.y0axid7.mongodb.net/FOILAR?retryWrites=true&w=majority', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB connection successful'))
// .catch(err => {
//   console.error('MongoDB connection error:', err.message);
//   console.error('Error stack:', err.stack);
// });

mongoose.connect('mongodb+srv://ayush1777:agr11@cluster0.0128p.mongodb.net/FOILAR', { useNewUrlParser: true,  });
const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB');
});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use('/uploads', express.static('uploads'));


// API endpoints
// app.post('/api/addCustomer', async (req, res) => {
//   try {
//     const customer = new Customer({
//       ...req.body,
//       customerID: uuidv4(), // Assign a unique ID
//     });
//     await customer.save();
//     res.status(201).json({ message: 'Customer added successfully', customerId: customer.customerID });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });

app.post('/api/addSupplier', async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).send(supplier);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.send(customers);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.send(suppliers);
  } catch (error) {
    res.status(500).send(error);
  }
});

// app.get('/api/customer/:customerId', async (req, res) => {
//   const { customerId } = req.params;
//   const customer = await Customer.findById(customerId);
//   if (!customer) return res.status(404).send('Customer not found');

//   res.send(customer);
// });

// const http = require('http');
// // const socketIo = require('socket.io');
// const { Server } = require('socket.io');

// const server = http.createServer(app);
// // const io = socketIo(server);
// const io = new Server(server, {
//   cors: {
//       origin: 'http://localhost:3000', // Replace with your frontend origin
//       methods: ['GET', 'POST'],
//   },
// });
// io.on('connection', (socket) => {
//   socket.on('joinRoom', (room) => {
//     socket.join(room);
//   });

//   socket.on('leaveRoom', (room) => {
//     socket.leave(room);
//   });

//   socket.on('sendMessage', (message) => {
//     io.to(message.customerID).emit('receiveMessage', message);
//   });
// });

// Create HTTP serve
// Initialize Socket.IO


const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

