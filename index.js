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

        // get watches
        app.get('/watch', async (req, res) => {
            const watchData = await watchCollection.find({})
            const watchDataArray = await watchData.toArray()
            res.json(watchDataArray)
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
        // order post
        app.post('/order', async (req, res) => {
            // console.log("posted")
            const query = req.body;
            const result = await orderCollection.insertOne(query);
            // console.log(result)
            res.json(result)
        })
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