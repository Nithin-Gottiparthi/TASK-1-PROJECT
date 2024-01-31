const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
