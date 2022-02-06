const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const doenv = require('dotenv').config()
const { MongoClient } = require('mongodb');

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4tdkj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
 
async function run(){
    try{
        await client.connect();
        const database = client.db('doctordb') 
        const appoinmentsColection = database.collection('appoinments');
        const usersColection = database.collection('users');

        // appointments : post

        app.post('/appointments', async( req, res )=>{
            const appointment = req.body; 
            const result = await appoinmentsColection.insertOne(appointment);
            res.json(result)
        });

        // appointments : get

        app.get('/appointments', async( req , res)=>{
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString() ; 
            const query = { email : email, date: date}
            const cursor = appoinmentsColection.find(query);
            const appointments = await cursor.toArray();
            res.json(appointments);
        })

        // users : post
        app.post('/users', async( req, res )=>{
            const user = req.body;
            const result = await usersColection.insertOne(user);
   
            res.json(result)
        })
        // users : put

        app.put('/users', async( req , res )=>{
            const user = req.body; 
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = {$set: user}
            const result = await usersColection.updateOne(filter, updateDoc, options)

            res.json(result)

        })





    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);




app.get('/', ( req, res)=>{
    res.send("Hello Doctors portal.")
})

app.listen(port, ()=>{
    console.log(`Server is running on Port ${port}`)
})