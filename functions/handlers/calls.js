const { response } = require('express');
const firebase = require('firebase');

const { admin, db } = require('../util/admin');
const config = require('../util/config');

firebase.initializeApp(config);

//the function that loads the card depending on the url
exports.getCard = (req, response) => {

    //declare an empty variable for the response data to be used in
    let cardData = {}

    //the actual request to the firestore
    //convert to lowercase to ensure that the correct one is obtained
    db.doc(`/cards/${req.params.urlname.toLowerCase()}`).get()
        .then((doc) => {
            //if the doc exists, then return the data from it
            if(doc.exists){
                cardData = doc
                return  response.json(doc.data())
            }
            //if the doc doesn't exist, return an error message
            else {
                return response.json({ error: 'this business card does not exist' })
            }
        })
        .catch((err) => {
            return response.status(404).json({error: err})
        })
}

//creates a new card
exports.newCard = (req, response) => {

    //create a variable for the data
    let cardData = {
        name: req.body.name,
        imageURL: false,
        backgroundCol: '#121212',
        jobtitle: req.body.jobtitle,
        phonenumber: req.body.phonenumber,
        email: req.body.email,
        site: req.body.site,
        businessname: req.body.businessname,
        //convert the url to lowercase, prevent people using capitalisation to spoof names etc
        urlname: req.body.urlname.toLowerCase(),
    }

    //a check for duplicates before creating or overwriting
    db.doc(`/cards/${cardData.urlname}`).get()
    .then((doc) => {
        if(doc.exists){
            //if there is a doc with that name the return this
            return response.json({duplicate: 'that card already exists'})
        }

        //if not then go ahead and try to create the doc
        else{
            //uses .set to give the DB doc a name for easy URL handling
            admin.firestore()
            .collection('cards').doc(cardData.urlname)
            .set(cardData)
            .then((doc) => {
                const resCard = cardData;
                resCard.screamId = doc.id;
                response.json(resCard);
            })
            .catch(err => {
                response.status(500).json({ error: 'something went wrong'});
            })
        }
    })
        .catch(err => {
            response.status(500).json({ error: 'something went wrong'});
            console.log(err);
        })
        //returns a duplicate error
    .catch((err) => {
        return response.json({duplicate: 'that card already exists'})
    })

}

//this is just for debugging to check to see if a card exists
exports.checkCards = (req, response) => {
    db.doc(`/cards/${req.params.urlname}`).get()
    .then((doc) => {
        if(doc.exists){
            return response.json({duplicate: 'that card already exists'})
        }
        else {
            return response.status(200).json({ success: 'that doesnt exist yet', doc })
        }
    })
    .catch(err => {
        response.status(500).json({ error: 'something went wrong'});
        console.log(err);
    })
}


//handling the colour changing
exports.changeCol = (req, response) => {
    //sets the new background colour
    db.doc(`/cards/${req.params.urlname}`).update({ 'backgroundCol' : req.body.backCol });
    //removes the background image and sets it to false
    db.doc(`/cards/${req.params.urlname}`).update({ 'imageURL' : false });
    //returns a confirmation message and the colour for client side updates
    response.status(200).json({ success: "background image removed, colour updated", colour: req.body.backCol})
}

//busboy is an npm package for handling uploads
//uploads user profile picture
exports.imageUpload = (req, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    //even though they aren't all going to be used, for busboy you have to enter all the parameters like that
    //e.g. if you removed 'encoding' then it will still look for encoding but it will use the property of 'mimetype'
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        //using a split to match the start of the mime type so that image file types can be uploaded without having to create a case for each of them
        if (mimetype.split('/')[0] !== 'image') {
            return response.status(400).json({ error: 'Only images can be uploaded' });
        }

        //this splits the uploaded file's name then obtains whatever comes after the last dot and uses that to get the file extension
        const imageExt = filename.split('.')[filename.split('.').length - 1];

        //this generates a random number and adds the file extension from above
        imageFileName = `${Math.round(Math.random() * 10000000)}.${imageExt}`;
        const filePath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = {filePath, mimetype}

        file.pipe(fs.createWriteStream(filePath));
    });
    
    //finally uploads the image
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata:{
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        //updates the card image URL to that of the newly uploaded image
        .then(() => {
            const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/cards/${req.params.urlname}`).update({ imageURL });
        })
        .then(() => {
            //returning the image URL lets you update the front end quickly without then having to make call for the new data
            const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            return response.json({ message: 'image uploaded successfully', image: imageURL})
        })
        .catch(err => {
            console.error(err);
            return response.status(500).json({error: err.code});
        });
    });
    busboy.end(req.rawBody);
};