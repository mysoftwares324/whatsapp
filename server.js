const express = require('express');
const m = require('./sessionManager');

const app = express();

// TEST ROUTE (IMPORTANT)
app.get('/', (req, res) => {
    res.send("Server Running ✅");
});

// AUTO START
m.create("default");

// STATUS
app.get('/status', (req, res) => {
    res.send(m.getStatus("default"));
});

// QR
app.get('/qr', (req, res) => {
    res.send(m.getQR("default"));
});

// SEND
app.get('/send', async (req, res) => {
    try {
        const number = req.query.number;
        const message = req.query.message;

        let c = m.get("default");

        if (m.getStatus("default") !== "ready") {
            return res.send("Not Ready");
        }

        await c.sendMessage(number + "@c.us", message);

        res.send("Sent");

    } catch (e) {
        res.send("Error");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started");
});
