require('dotenv').config()
const express = require('express');
const app = express()
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nryb4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

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
        // order gett
        app.get('/order', async (req, res) => {
            const result = await orderCollection.find({});
            const orders = await result.toArray()
            res.json(orders)
        })
        // order post
        app.post('/order', async (req, res) => {
            // console.log("posted")
            const query = req.body;
            const result = await orderCollection.insertOne(query);
            // console.log(result)
            res.json(result)
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
        app.put('/user', async (req, res) => {
            const user = req.body;
            const cursor = { email: user.email };
            const option = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(cursor, updateDoc, option);
            // res.json(result);
            console.log('success put')
        });
        app.put('/admin/:email', async (req, res) => {
            const user = req.params.email;
            const cursor = { email: user };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await userCollection.updateOne(cursor, updateDoc);
            console.log('success admin put', result)
            res.json(result)
        });
    } finally {
        // client.close()
    }
}
run().catch(console.dir)
const port = process.env.PORT || 7000
app.get('/', (req, res) => {
    res.send('connected')
})
app.listen(port, () => console.log('connected at ', port))