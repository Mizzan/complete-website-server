const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const port = process.env.PORT || 7000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const serviceAccount = require('./remarket-26263-firebase-adminsdk-oe5x9-b5972c7800.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://reMarket:kRuFSaT3dhwRQo8n@cluster0.yk7ln.mongodb.net/reMarket?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const reviewsCollection = client
    .db(process.env.DB_NAME)
    .collection('reviews');
  const servicesCollection = client
    .db(process.env.DB_NAME)
    .collection('services');
  const ordersCollection = client.db(process.env.DB_NAME).collection('orders');
  console.log('Yes It is connected to the DATABASE.');

  // get all services
  app.get('/services', (req, res) => {
    servicesCollection.find().toArray((err, services) => {
      res.send(services);
    });
  });

  // get all reviews
  app.get('/reviews', (req, res) => {
    reviewsCollection.find().toArray((err, services) => {
      res.send(services);
    });
  });

  // adding review
  app.post('/addReview', (req, res) => {
    const newReview = req.body;
    reviewsCollection.insertOne(newReview).then((result) => {
      console.log('adding new review: ', newReview);
      res.send(result.insertedCount > 0);
    });
  });

  // adding service
  app.post('/addService', (req, res) => {
    const newService = req.body;
    servicesCollection.insertOne(newService).then((result) => {
      console.log('adding new Service: ', newService);
      res.send(result.insertedCount > 0);
    });
  });

  // adding the orders api
  app.post('/addOrders', (req, res) => {
    const newOrders = req.body;
    ordersCollection
      .insertOne(newOrders)
      .then((result) => res.send(result.insertedCount > 0));
  });

  // get order items api
  app.get('/orders', (req, res) => {
    // console.log(req.query.email);
    // console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            ordersCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          } else {
            res.status(401).send('unauthorized access');
          }
        })
        .catch((error) => {
          // Handle error
          res.status(401).send('unauthorized access');
        });
    } else {
      res.status(401).send('unauthorized access');
    }
  });

  // // removing / deleting  order items api
  // app.delete('/deleteItem/:id', (req, res) => {
  //   const id = ObjectID(req.params.id);
  //   console.log('delete this', id);
  //   itemsCollection.findOneAndDelete({ _id: id }).then((documents) => {
  //     res.send(!!documents.value);
  //     console.log(documents.value);
  //   });
  // });
  // // removing / deleting  order items api
  // app.delete('/deleteItem/:id', (req, res) => {
  //   const id = ObjectID(req.params.id);
  //   console.log('delete this', id);
  //   itemsCollection.findOneAndDelete({ _id: id }).then((documents) => {
  //     res.send(!!documents.value);
  //     console.log(documents.value);
  //   });
  // });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
