const MongoClient = require("mongodb").MongoClient;

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

require("dotenv").config();

const bcrypt = require('bcryptjs');
const saltRounds = 10;

app.use(cors());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

MongoClient.connect(process.env.MONGODB_CONNECTION_STR, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database');

    const db = client.db('vn-users');
    const usersCollection = db.collection('users');

    app.get('/users/userByEmail/', (req, res) => {
      const { email, password } = req.body;
      
      usersCollection.findOne({ email })
        .then(userFound => {
          if(userFound) {
            bcrypt.compare(password, userFound.password, function(err, result) {
              if(result) res.status(200).send(userFound);
              else res.status(403).send({ msg: "Invalid credentials"})
            });
          }
          else {
            res.status(404).send({ msg: `User not found with email: ${email}`})
          }
        })
        .catch(error => res.status(400).send(error))
    })

    app.post('/users/new', (req, res) => {
      const { id, name, email, password } = req.body;

      bcrypt.hash(password, saltRounds, (err, hash) => {
        const newUser = {
          id: id,
          name: name,
          email: email,
          password: hash
        }
        usersCollection.insertOne(newUser)
          .then(result => res.status(201).send(result))
          .catch(error => res.status(400).send(error))
      });
    })

  })
  .catch(error => console.error(error))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(process.env.PORT || 5000);
module.exports = app;