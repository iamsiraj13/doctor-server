const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const doenv = require("dotenv").config();
const { MongoClient } = require("mongodb");
const admin = require("firebase-admin");

const serviceAccount = require("./doctors-portal-admin-sdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

// doctors-portal-admin-sdk.json

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4tdkj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("doctordb");
    const appoinmentsColection = database.collection("appoinments");
    const usersColection = database.collection("users");

    // appointments : post

    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appoinmentsColection.insertOne(appointment);
      res.json(result);
    });

    // appointments : get

    app.get("/appointments", verifyToken, async (req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toLocaleDateString();
      const query = { email: email, date: date };
      const cursor = appoinmentsColection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });

    // get admin

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersColection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // users : post
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersColection.insertOne(user);

      res.json(result);
    });
    // users : put-- save new user info...

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersColection.updateOne(filter, updateDoc, options);

      res.json(result);
    });

    // make admin
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;

      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersColection.findOne({
          email: requester,
        });
        if (requesterAccount === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersColection.updateOne(filter, updateDoc);
          res.json(result);
        }
      }else{
          res.status(403).json({message: 'you do not have access to make admin'})
      }

    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Doctors portal.");
});

app.listen(port, () => {
  console.log(`Server is running on Port ${port}`);
});
