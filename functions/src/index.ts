import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.getWifiEstimates = functions.https.onRequest(async (req, res) => {
    const wifiDataCollection = admin.firestore().collection('wifiEstimates');
    try {
        const snapshot = await wifiDataCollection.orderBy('createdAt', 'desc').get();
        let wifiDataArray = [];
        snapshot.forEach(doc => {
            let docData = doc.data();
            if (docData.hasOwnProperty('estimate')) {
                wifiDataArray.push(docData);
            }
        });
        res.json({ estimates: wifiDataArray });
    } catch (error) {
        console.error("Error fetching wifi estimates: ", error);
        res.status(500).send(error);
    }
})

exports.uploadWifiEstimates = functions.https.onRequest(async (request, response) => {
    try {
        const data = request.body;

        if (!data || !data['estimate']) {
            response.status(400).send('Bad Request: Missing data');
            return;
        }

        const now = new Date();

        const minutes = now.getMinutes();
        const roundedMinutes = minutes - (minutes % 15);
        now.setMinutes(roundedMinutes, 0, 0);

        const uploadData = {
            estimate: parseInt(data['estimate'], 10),
            createdAt: admin.firestore.Timestamp.fromDate(now),
        };

        const docRef = await admin.firestore().collection('wifiEstimates').add(uploadData);

        response.status(200).send(`Document written with ID: ${docRef.id}`);
    } catch (error) {
        console.error("Error adding document: ", error);
        response.status(500).send("Error writing document");
    }
})

exports.getWifiData = functions.https.onRequest(async (req, res) => {
    const wifiDataCollection = admin.firestore().collection('wifiData');
    try {
        const snapshot = await wifiDataCollection.orderBy('createdAt', 'desc').get();
        let wifiDataArray = [];
        snapshot.forEach(doc => {
            let docData = doc.data();
            if (docData.hasOwnProperty('groundTruth')) {
                wifiDataArray.push(docData);
            }
        });
        res.json({ wifiData: wifiDataArray });
    } catch (error) {
        console.error("Error fetching wifi data: ", error);
        res.status(500).send(error);
    }
});

export const uploadWiFiData = functions.https.onRequest(async (request, response) => {
    try {
        const data = request.body;

        if (!data || !data.numValid) {
            response.status(400).send('Bad Request: Missing data');
            return;
        }

        const N_v = [], N_r = [];
        for (let key in data) {
            if (key.startsWith('N_v_')) {
                N_v.push(parseInt(data[key], 10));
            } else if (key.startsWith('N_r_')) {
                N_r.push(parseInt(data[key], 10));
            }
        }

        const now = new Date();

        const minutes = now.getMinutes();
        const roundedMinutes = minutes - (minutes % 15);
        now.setMinutes(roundedMinutes, 0, 0);

        const uploadData = {
            valid: parseInt(data['numValid'], 10),
            unique: parseInt(data['numUnique'], 10),
            random: parseInt(data['random'], 10),
            N_v: N_v,
            N_r: N_r,
            createdAt: admin.firestore.Timestamp.fromDate(now),
        };

        if(data['groundTruth'] && parseInt(data['groundTruth']) != -1) {
            uploadData['groundTruth'] = parseInt(data['groundTruth']);
        }

        const docRef = await admin.firestore().collection('wifiData').add(uploadData);

        response.status(200).send(`Document written with ID: ${docRef.id}`);
    } catch (error) {
        console.error("Error adding document: ", error);
        response.status(500).send("Error writing document");
    }
});
