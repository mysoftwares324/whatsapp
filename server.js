const express = require('express');
const m = require('./sessionManager');

const app = express();
app.use(express.json());

// TEST ROUTE
app.get('/', (req, res) => res.send("Server Running ✅"));

// AUTO START DEFAULT SESSION
m.create("default");

// STATUS
app.get('/status/:session', (req, res) => {
    res.send(m.getStatus(req.params.session));
});

// QR
app.get('/qr/:session', (req, res) => {
    res.send(m.getQR(req.params.session));
});

// SEND MESSAGE
app.post('/send', async (req, res) => {
    try {
        const { number, message, session } = req.body;
        let client = m.get(session);
        if (!client || m.getStatus(session) !== "ready") return res.send("Not Ready");

        await client.sendMessage(number + "@c.us", message);
        res.send("Sent ✅");
    } catch (e) {
        console.error(e);
        res.send("Error ❌");
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));
