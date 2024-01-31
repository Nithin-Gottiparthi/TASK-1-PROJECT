const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Serve HTML signup form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Sign Up.html');
});

// Handle signup request
app.post('/submit', async (req, res) => {
  const { firstname, lastname, DOB, gender, email, mobileNumber, password } = req.body;

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
    const db = client.db('ecowave');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the form data into the collection with the hashed password
    await db.collection('signUpDetails').insertOne({
      firstname,
      lastname,
      DOB,
      gender,
      email,
      mobileNumber,
      password: hashedPassword,
      // Add more fields as needed
    });

    // Close the MongoDB connection
    client.close();

    // Redirect to the Login.html page
    res.redirect('/Login.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Serve HTML login form
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/Login.html');
});

// Handle login request
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Received login request:', { email, password });

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
    const db = client.db('ecowave');

    // Find the user with the provided email
    const user = await db.collection('signUpDetails').findOne({ email });
    console.log('User from database:', user);

    if (user) {
      // Compare the provided password with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Password Match:', passwordMatch);

      if (passwordMatch) {
        // Redirect to a success page or perform further actions
        res.redirect('/success.html');
      } else {
        res.send("<script>alert('Incorrect password');</script>");
      }
    } else {
      res.send("<script>alert('User not found');</script>");
    }

    // Close the MongoDB connection
    client.close();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Serve HTML forgot password form
app.get('/forgotPassword', (req, res) => {
  res.sendFile(__dirname + '/forgotpassword.html');
});

// Handle forgot password request
app.post('/sendOTP', async (req, res) => {
  const { email } = req.body;

  // Generate OTP
  const generatedOTP = randomstring.generate({
    length: 6,
    charset: 'numeric'
  });

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
    const db = client.db('ecowave');

    // Store the generated OTP as a string in the database for the user
    await db.collection('signUpDetails').updateOne(
      { email },
      { $set: { otp: generatedOTP.toString().trim() } }
    );

    // Close the MongoDB connection
    client.close();

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'kaitlin.volkman@ethereal.email',
        pass: 'BXrKVw2YugpaXqcFFa'
      }
    });

    const mailOptions = {
      from: 'kaitlin.volkman@ethereal.email',  // Update with your email address
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is: ${generatedOTP}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      } else {
        console.log('Email sent: ' + info.response);
        res.redirect('/otpverify.html');
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Handle OTP verification and password reset
app.post('/resetPassword', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Log the entire request body
  console.log('Request body:', req.body);

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
    const db = client.db('ecowave');

    // Log the email variable
    console.log('Email variable:', email);

    // Find the user with the provided email and OTP
    const user = await db.collection('signUpDetails').findOne({ email, otp });

    // Log the user object from the database
    console.log('User from database during password reset:', user);

    if (user) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password in the database
      await db.collection('signUpDetails').updateOne(
        { email },
        { $set: { password: hashedPassword } }
      );

      // Clear the OTP in the user document after successful password update
      await db.collection('signUpDetails').updateOne(
        { email },
        { $unset: { otp: '' } }
      );

      client.close();

      res.redirect('/Login.html');
    } else {
      console.log('User not found or incorrect OTP during password reset');
      res.send("<script>alert('Incorrect OTP or User not found');</script>");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
