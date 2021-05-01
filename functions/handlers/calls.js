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
    db.doc(`/cards/${req.params.urlname}`).get()
        .then((doc) => {
            if(doc.exists){
                cardData = doc
                return  response.json(doc.data())
            }
            else {
                return response.status(404).json({ error: 'this business card does not exist' })
            }
        })
        .catch((err) => {
            return response.status(404).json({error: err})
        })
}

//creates a new card
//TODO add a check to confirm unique cards
exports.newCard = (req, response) => {
    let cardData = {
        name: req.body.name,
        imageURL: req.body.image,
        jobtitle: req.body.jobtitle,
        phonenumber: req.body.phonenumber,
        site: req.body.site,
        businessname: req.body.businessname,
        urlname: req.body.urlname,
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
                console.log(err);
            })
        }
    })
        .catch(err => {
            response.status(500).json({ error: 'something went wrong'});
            console.log(err);
        })
    .catch((err) => {
        return response.json({duplicate: 'that card already exists'})
    })

}

exports.checkCards = (req, response) => {
    // let beep = req.params.urlname
    // db.collection('cards').where('urlname', '==', req.params.urlname).get()
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
    
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata:{
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/cards/${req.urlname}`).update({ imageURL });
        })
        .then(() => {
            return response.json({ message: 'image uploaded successfully'})
        })
        .catch(err => {
            console.error(err);
            return response.status(500).json({error: err.code});
        });
    });
    busboy.end(req.rawBody);
};