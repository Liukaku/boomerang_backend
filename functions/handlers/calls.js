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
        image: req.body.image,
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