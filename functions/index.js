const functions = require("firebase-functions");
const fbadmin = require('firebase-admin')

const { admin, db } = require('./util/admin')
const { getCard, checkCards } = require('./handlers/calls')
const { newCard } = require('./handlers/calls')

const app = require('express')();
const { response } = require('express');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

//create new business card
app.post('/card', newCard)

//get existing by URL
app.get('/card/:urlname', getCard)

app.get('/check/:urlname', checkCards)

exports.api = functions.region('europe-west1').https.onRequest(app);