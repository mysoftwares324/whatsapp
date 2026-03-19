const express = require('express');
const m = require('./sessionManager');

const app = express();

// AUTO START
m.create("default");

// SEND API
app.get('/send', async (req, res) => {
    try {
        const n = req.query.number;
        const msg = req.query.message;
        const s = req.query.session || "default";

        let c = m.get(s) || m.create(s);

        if (m.getStatus(s) !== "ready") {
            return res.send("Not Ready");
        }

        await c.sendMessage(n + "@c.us", msg);

        res.send("Sent");

    } catch (e) {
        res.send("Error");
    }
});

// STATUS
app.get('/status', (req, res) => {
    res.send(m.getStatus(req.query.session || "default"));
});

// QR
app.get('/qr', (req, res) => {
    res.send(m.getQR(req.query.session || "default"));
});

// CREATE
app.get('/create', (req, res) => {
    m.create(req.query.name);
    res.send("OK");
});

app.listen(process.env.PORT || 3000);