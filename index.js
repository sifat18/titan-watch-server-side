require('dotenv').config()
const express = require('express');
const app = express()
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;
const port = process.env.PORT || 7000

const stripe = require('stripe')(process.env.STRIPE_SECRECT)
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nryb4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

async function run() {
    try {
        await client.connect();
        const titanDB = client.db('titan')
        const watchCollection = titanDB.collection('watches')
        const reviewCollection = titanDB.collection('reviews')
        const orderCollection = titanDB.collection('orders')
        const userCollection = titanDB.collection('users')

        // get watches
        app.get('/watch', async (req, res) => {
            const watchData = await watchCollection.find({})
            const watchDataArray = await watchData.toArray()
            res.json(watchDataArray)
        })
        // add new watch
        app.post('/watch', async (req, res) => {
            const data = req.body
            const result = await watchCollection.insertOne(data);
            res.send(result.acknowledged)
        })

        // delete watch by id
        app.delete('/watch/:id', async (req, res) => {
            console.log('hitting watch delete')
            const filter = req.params.id;
            const query = { _id: ObjectID(filter) }
            const data = await watchCollection.deleteOne(query);
            res.send(data)
        })
        // get watch BYid
        app.get('/watch/:id', async (req, res) => {
            console.log('connected')
            const cursor = req.params.id
            const filter = { _id: ObjectID(cursor) }
            const watchData = await watchCollection.findOne(filter)
            res.json(watchData)
        })
        // get reviews
        app.get('/reviews', async (req, res) => {
            const reviewData = await reviewCollection.find({})
            const reviewDataArray = await reviewData.toArray()
            res.json(reviewDataArray)
        })
        // post reviews
        app.post('/reviews', async (req, res) => {
            console.log('hitting reviews');
            const query = req.body;

            const cursor = await reviewCollection.insertOne(query)
            res.json(cursor)
        })
        // order gett
        app.get('/order', async (req, res) => {
            const result = await orderCollection.find({});
            const orders = await result.toArray()
            res.json(orders)
        })
        // order gett By id
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await orderCollection.findOne(query);
            res.json(result)
        })

        // payment update
        app.put('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectID(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            };
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // order post
        app.post('/order', async (req, res) => {
            // console.log("posted")
            const query = req.body;
            const result = await orderCollection.insertOne(query);
            // console.log(result)
            res.json(result)
        })

        // get order by emails
        app.get('/order/:mail', async (req, res) => {
            const filter = req.params.mail;
            const query = { email: filter }
            const data = await orderCollection.find(query).toArray();
            res.send(data)
        })
        // update Order status
        app.put('/orderUpdate/:id', async (req, res) => {
            console.log('orderupdate put');
            const msg = 'shipped';
            const filter = req.params.id;
            const query = { _id: ObjectID(filter) }
            const data = await orderCollection.updateOne(query, {
                $set: {
                    orderStatus: "shipped",
                }
            });
            console.log(data)
            res.send(data)
        })
        // delete order by id
        app.delete('/order/:id', async (req, res) => {
            console.log('hitting order delete')
            const filter = req.params.id;
            const query = { _id: ObjectID(filter) }
            const data = await orderCollection.deleteOne(query);
            res.send(data)
        })



        // registering users for the first time
        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log('success');
            // res.json(result);
        });
        //checking admin or not
        app.get('/user/:email', async (req, res) => {
            console.log('hitting admin check')
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            let Isadmin = false;
            if (result?.role == 'admin') {
                Isadmin = true
            }
            console.log('success');
            res.json({ admin: Isadmin });
        });
        app.put('/user', async (req, res) => {
            const user = req.body;
            const cursor = { email: user.email };
            const option = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(cursor, updateDoc, option);
            // res.json(result);
            console.log('success put')
        });
        app.put('/admin/email', verifyToken, async (req, res) => {

            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await userCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        });

        // payment
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = parseInt(paymentInfo.price) * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })



    } finally {
        // client.close()
    }
}
run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('connected')
})
app.listen(port, () => console.log('connected at ', port))