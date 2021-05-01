const admin = require('firebase-admin');
const { response } = require('express');

admin.initializeApp();

const db = admin.firestore();

db.settings({ ignoreUndefinedProperties: true })

module.exports = { admin, db };