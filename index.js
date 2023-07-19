const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv98vtg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}










async function run() {
  try{
      await client.connect();
      const productData = client.db('troyalelectro').collection('products');
      const reviewData = client.db('troyalelectro').collection('review');
      const userData = client.db('troyalelectro').collection('users');
      const orderData = client.db('troyalelectro').collection('order');
      const paymentData = client.db('troyalelectro').collection('payment');
      const verifyAdmin = async (req, res, next) => {
        const requester = req.decoded.email;
        const requesterAccount = await userCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
          next();
        }
        else {
          res.status(403).send({ message: 'forbidden' });
        }
      }
      // connot create send grid account
      //product display
    app.get('/products',  async(req, res) =>{
        const query = {};
        const cursor = productData.find(query);
        const product = await cursor.toArray();
        res.send(product);
    });


    app.get('/orders',  verifyJWT, async(req, res) =>{
      const query = {};
      const cursor = orderData.find(query);
      const order = await cursor.toArray();
      res.send(order);
   });




    app.get('/order',  verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { email : email };
      const order = await orderData.find(query).toArray();
      return res.send(order);
    });


    app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
      const service = req.body;
      const price = service.payprice;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });
   
     
    app.get('/review', async(req, res) =>{
        const query = {};
        const cursor = reviewData.find(query);
        const review = await cursor.toArray();
        res.send(review);
    });
    app.get('/users', verifyJWT, async (req, res) => {
      const users = await userData.find().toArray();
      res.send(users);
    });
    app.get('/products/:id',  async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await productData.findOne(query);
      res.send(result);
   });
   
   app.get('/order/:id',   async(req, res) =>{
     const id = req.params.id;
     const query = {_id: ObjectId(id)};
     const booking = await orderData.findOne(query);
     res.send(booking);
    })


    app.post('/products',  async (req, res) => {
      const Productdata = req.body;
      const result = await productData.insertOne(Productdata);
      res.send(result);
    });
    app.post('/order', verifyJWT,  async (req, res) => {
      const orderdata = req.body;
      const result = await orderData.insertOne(orderdata);
      res.send(result);
    });
   
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userData.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })
    app.get('/user1/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userData.findOne({ email: email });
      res.send(user)
    })


    app.put('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userData.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.put('/users/nonadmin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: ' ' },
      };
      const result = await userData.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.patch('/order/:id', verifyJWT, async(req, res) =>{
      const id  = req.params.id;
      const payment = req.body;
      const filter = {_id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }
      const result = await paymentData.insertOne(payment);
      const updatedorder = await orderData.updateOne(filter, updatedDoc);
      res.send(updatedorder);
    })
    app.put('/order/orders/:id', async(req, res) =>{
      const id  = req.params.id;
      const filter = {_id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          status: 'shipped'
        },
      }
      const updatedorder = await orderData.updateOne(filter, updatedDoc);
      res.send(updatedorder);
    })
    app.get('/users1/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
     
      const result = await userData.findOne(filter);
      res.send(result);
    });


   
    app.put('/users1/:email', async (req, res) => {
      const currentUser = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {education: currentUser.education,
              location: currentUser.location,
              phoneN: currentUser.phoneN,
              address: currentUser.address,
              socialurl: currentUser.socialurl,
              email: email
        },
      };
      const result = await userData.updateOne(filter, updateDoc, options);
      res.send(result);
    });






   






    app.get('/order/:id', verifyJWT, async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const orders = await orderData.findOne(query);
      res.send(orders);
    })
    // delete a order
    app.delete('/orders/:id', verifyJWT,  async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderData.deleteOne(query);
      res.send(result);
   })
    app.delete('/order/:id', verifyJWT,  async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderData.deleteOne(query);
      res.send(result);
   })
    // delete a products
    app.delete('/products/:id', verifyJWT,  async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await productData.deleteOne(query);
      res.send(result);
   })


    app.post('/review', verifyJWT,   async (req, res) => {
      const reviewtdata = req.body;
      const result = await reviewData.insertOne(reviewtdata);
      res.send(result);
    });


    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userData.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    });


   
 
    }
    finally{


    }
   
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send(`<h1 style="text-align: center;
      color: red;"> Server is Running at <span style="color: Blue;">${port}</span></h1>`);
  });


app.listen(port, () => {
  console.log("Trayal server Running at Port : ", port);
});
