const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const PORT = process.env.PORT || 5000;
require("dotenv").config();

// MiddleWares
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.t245pno.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("RentHunter").collection("users");

    // Create A User
    app.post("/api/signUp", async (req, res) => {
      try {
        const userData = req.body;
        const email = userData.userEmail;
        const query = { userEmail: email };
        const isUserExist = await userCollection.findOne(query);
        if (isUserExist) {
          return res.send({ message: "User Already Exist" });
        }
        const result = await userCollection.insertOne(userData);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Sing IN User
    app.patch("/api/signIn", async (req, res) => {
      try {
        const userData = req.body;
        const email = userData.userEmail;
        const query = { userEmail: email };
        const DataOnDb = await userCollection.findOne(query);
        if (!DataOnDb) {
          return res.send({ message: "No Account Found" });
        } else if (DataOnDb.password !== userData.password) {
          return res.send({ message: "Password Doesn't Match Try Again" });
        }
        res.send({ message: "User Credential Matched" });
      } catch (error) {
        console.log(error);
      }
    });

    // Get Signed In User Data From Db
    app.get("/api/getUserInfo", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send({ message: "Rent House Server Is Running Well" });
});
app.listen(PORT, () => {
  console.log(`Rent Hunter Is Running On PORT ${PORT}`);
});
