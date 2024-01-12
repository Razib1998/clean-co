const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, Collection } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;


// middlewares

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://admin:admin@cluster0.rzv4y0u.mongodb.net/clean-co?retryWrites=true&w=majority";

console.log(process.env.DB_USER);

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

    const serviceCollection = client.db("clean-co").collection("services");
    const bookingCollection = client.db("clean-co").collection("bookings");
 

    // get method

    app.get("/api/v1/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // post method

    app.post("/api/v1/user/create-booking", async(req, res)=>{
        const booking = req.body;
        console.log(booking);
        const result = await bookingCollection.insertOne(booking);
        console.log(result);
        res.send(result);
    })

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
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
