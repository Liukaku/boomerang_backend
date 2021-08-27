const functions = require("firebase-functions");
const fbadmin = require('firebase-admin')

const { admin, db } = require('./util/admin')
const { getCard, checkCards, imageUpload, newCard, changeCol } = require('./handlers/calls')

const app = require('express')();
const cors = require('cors')

app.use(cors())
const { response } = require('express');



//create new business card
app.post('/card', newCard)

//get existing by URL
app.get('/card/:urlname', getCard)

//upload an image
app.post('/card/image/:urlname', imageUpload)

//for debugging endpoint for confirming if a url is in use
app.get('/check/:urlname', checkCards)

//used to change the colour for the card background and deletes the background image
app.put('/card/background/:urlname', changeCol)

// Take the text parameter passed to this HTTP endpoint and insert it into 
// Firestore under the path /messages/:documentId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('messages').add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

exports.api = functions.region('europe-west1').https.onRequest(app);
