const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const roomCollection = client.db("RentHunter").collection("room");

    app.get('/api/houses',async(req,res)=>{
      const result = await roomCollection.find().toArray()
      res.send(result)
    })

    app.post('/api/jwt',async(req,res)=>{
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h",
        });
        res.send({ token });
      } catch (error) {
        console.log(error);
      }
    })

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
          return res.send({ signIn: false, message: "No Account Found" });
        } else if (DataOnDb.password !== userData.password) {
          return res.send({
            signIn: false,
            message: "Password Doesn't Match Try Again",
          });
        }
        const userEmail = DataOnDb.userEmail;
        const role = DataOnDb.role;
        const userName = DataOnDb.userName;
        const loggedUserData = {userEmail,role,userName}
        res.send({ signIn:true,loggedUserData });
      } catch (error) {
        console.log(error);
      }
    });
    // Add New Room
    app.post("/api/addRoom", async (req, res) => {
      const roomData = req.body;
      const result = await roomCollection.insertOne(roomData);
      res.send(result);
    });

    // Get the listed Data for signIn User
    app.get("/api/getMyListedHouse", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await roomCollection.find(query).toArray();
      res.send(result);
    });
// Delete Room From MY LIsting
    app.delete("/api/deleteRoom/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomCollection.deleteOne(query);
      res.send(result);
    });
    // Get the room data for edit
    app.get("/api/getRoomDetail/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomCollection.findOne(query);
      res.send(result);
    });

    app.patch("/api/updateHouse/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: updatedData.name,
          city: updatedData.city,
          address: updatedData.address,
          bedrooms: updatedData.bedrooms,
          bathrooms: updatedData.bathrooms,
          roomSize: updatedData.roomSize,
          roomPicture: updatedData.roomPicture,
          rentPerMonth: updatedData.rentPerMonth,
          availabilityDate: updatedData.availabilityDate,
          phoneNumber: updatedData.phoneNumber,
          roomDescription: updatedData.roomDescription,
        },
      };
      const result = await roomCollection.updateOne(query, updateDoc);
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
