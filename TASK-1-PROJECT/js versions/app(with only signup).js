const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// Serve HTML form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Sign Up.html');
});

// Handle form submission
app.post('/submit', async (req, res) => {
  const { firstname, lastname, DOB, gender, email, mobileNumber, password } = req.body;

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const db = client.db('ecowave');

    // Insert the form data into the collection
    await db.collection('signUpDetails').insertOne({
      firstname,
      lastname,
      DOB,
      gender,
      email,
      mobileNumber,
      password,
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
