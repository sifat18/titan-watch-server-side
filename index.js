require('dotenv').config()
const express = require('express');
const app = express()
const cors = require('cors');

app.use(cors());
app.use(express.json())

const port = process.env.PORT || 7000
app.get('/', (req, res) => {
    res.send('connected')
})
app.listen(port, () => console.log('connected at ', port))