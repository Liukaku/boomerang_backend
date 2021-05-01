const functions = require("firebase-functions");
const fbadmin = require('firebase-admin')

const { admin, db } = require('./util/admin')
const { getCard, checkCards, imageUpload, newCard } = require('./handlers/calls')

const app = require('express')();
const { response } = require('express');


//TODO:
//Allow the creation of a secret password for each one
//so that you can edit it in the future if you wanted

//create new business card
app.post('/card', newCard)

//get existing by URL
app.get('/card/:urlname', getCard)

//upload an image
app.post('/card/image', imageUpload)

//debugging endpoint for confirming if a url is in use
app.get('/check/:urlname', checkCards)

exports.api = functions.region('europe-west1').https.onRequest(app);