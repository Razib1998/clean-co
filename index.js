const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const {
  MongoClient,
  ServerApiVersion,
  Collection,
  ObjectId,
} = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middlewares

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rzv4y0u.mongodb.net/clean-co?retryWrites=true&w=majority`;

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

    // Middleware for verify token

    const gatemen = (req, res, next) => {
      const token = req.cookies?.token;
      // Verify the token

      if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) {
          return res.status(401).send({ message: "Unauthorized access" });
        }

        // attach decoded user
        req.user = decoded;
        next();
      });
    };

    // get method

    app.get("/api/v1/services", gatemen, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // post method for bookings

    app.post("/api/v1/user/create-booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    //  User specific bookings

    app.get("/api/v1/user/bookings", gatemen, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;

      // Now match uer email with our cookies
      if (queryEmail !== tokenEmail) {
        res.status(403).send({ message: "Forbidden access" });
      }

      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // Delete Method for bookings

    app.delete("/api/v1/user/cancel-booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Authentication part

    app.post("/api/v1/auth/access-token", async (req, res) => {
      // Now we have to create our token

      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET);
      res
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: false,
        })
        .send({ success: true });
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
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
