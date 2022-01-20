const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const doenv = require('dotenv').config()

app.use(cors())
app.use(express.json())

app.get('/', ( req, res)=>{
    res.send("Hello world.")
})

app.listen(port, ()=>{
    console.log(`Server is running on Port ${port}`)
})