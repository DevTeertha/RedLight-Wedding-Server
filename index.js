const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const app = express()
require('dotenv').config();

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/services',express.static('services'))
app.use(fileUpload())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gqnhb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const redLightAdmin = client.db(process.env.DB_NAME).collection("admin");
  const redLightBookings = client.db(process.env.DB_NAME).collection("bookings");
  const redLightServices = client.db(process.env.DB_NAME).collection("services");
  const redLightReviews = client.db(process.env.DB_NAME).collection("reviews");

  app.get('/isAdmin', (req, res) => {
    const isAdminEmail = req.query.email;
    redLightAdmin.findOne({ email: isAdminEmail })
      .then(response => {
        if (response.email.length > 0) {
          res.send(true)
        }
        else {
          res.send(false)
        }
      })
  })

  app.get('/reviews', (req, res) => {
    redLightReviews.find({})
      .toArray((err, doc) => {
        res.send(doc)
      })
  })

  app.get('/services', (req, res) => {
    redLightServices.find({})
      .toArray((err, document) => {
        res.send(document)
      })
  })

  app.get('/bookings', (req, res) => {
    redLightBookings.find({})
      .toArray((err, document) => {
        res.send(document)
      })
  })

  app.get('/userBookingList', (req, res) => {
    const userEmail = req.query.email;
    redLightBookings.find({ email: userEmail })
      .toArray((err, doc) => {
        res.send(doc);
      })
  })

  app.post('/makeAdmin', (req, res) => {
    const email = req.body.email;

    redLightAdmin.insertOne({ email: email })
      .then(response => {
        res.send(response.insertedCount > 0);
      })
  })


  app.post('/bookNow', (req, res) => {
    const bookingInfo = req.body;
    redLightBookings.insertOne(bookingInfo)
      .then(response => {
        res.send(response.insertedCount > 0)
      })
      .catch(err => res.send(err))
  })

  app.post('/addService', (req, res) => {
    const serviceInfo = req.body;
    redLightServices.insertOne(serviceInfo)
    .then(response=>req.send(response.insertedCount>0))
    .catch(err=>res.send(false))
  })

  app.post('/addReview', (req, res) => {
    const reviewInfo = req.body;
    redLightReviews.insertOne(reviewInfo)
      .then(response => {
        res.send(response.insertedCount > 0)
      })
  })

  app.put('/updateStatus', (req, res) => {
    const data = req.body;
    redLightBookings.updateOne({ _id: new ObjectID(data.id) }, {
      $set: { "status": data.status },
      $currentDate: { "lastModified": true }
    })
      .then(response => {
        res.send(response.modifiedCount>0);
      })
  })

  app.delete('/deleteService/:id', (req, res) => {
    const deleteID = req.params.id;
    redLightServices.deleteOne({ _id: new ObjectID(deleteID) })
      .then(response => res.send(response.deletedCount > 0))
      .catch(err => res.send(err))
  })



  console.log("Database Connected");
});



app.get('/', (req, res) => {
  console.log("Server Running");
  res.send('Hello World')
})

app.listen(5000)