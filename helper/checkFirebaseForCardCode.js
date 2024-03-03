const admin = require('firebase-admin');
const crypto = require('crypto');
const serviceAccount = require("../config/firebaseAlkaffaaAccess.json");

//! Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const firestore = admin.firestore();

async function rechargeBalance({ code, userId }) {

    console.log("the code is :", code);

    const codeCrypto = encryptAES(code);

    console.log("Encrypted code is :", codeCrypto);

    const data = await firestore.collection('cart') //! get the cart document & shearch for the code
                .where('code', '==', codeCrypto)
                .get();

    console.log("Data from Firestore: ", data);

    if (data.empty) {
        throw new Error('خطا تحقق من الكارت');
        //! handle error
    }

    const cartDoc = data.docs[0];//TODO: get the first document of the data

    if (cartDoc.get('expired')) {
        throw new Error('الكارت مستخدم من قبل');
    }

    const amount = parseFloat(cartDoc.get('valueCard'));

    if (!cartDoc.get('expired')) {
        const appSpecificUserId = `storyApp_${userId}`;
        await firestore.collection('cart').doc(cartDoc.id).update({
            'expired': true,
            'timeUse': new Date().toString(),
            'userId': appSpecificUserId,
        });
    }

    return amount;
}

function encryptAES(plainText) {
    const key = Buffer.from(process.env.AES_KEY);
    const iv = Buffer.from(process.env.AES_IV);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(plainText, 'utf-8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
}

module.exports = rechargeBalance;
