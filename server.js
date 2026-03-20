const express = require('express');
const m = require('./sessionManager');
const app = express();
app.use(express.json());

// Test route
app.get('/', (req, res) => res.send("Server Running ✅"));

// Start session
app.get('/start', async (req, res) => {
    const { userId, sessionName } = req.query;
    await m.create(userId, sessionName);
    res.send("Session initializing...");
});

// Get QR
app.get('/qr', async (req, res) => {
    const { userId, sessionName } = req.query;
    const key = `${userId}-${sessionName}`;
    res.send(m.getQR(key));
});

// Get status
app.get('/status', async (req, res) => {
    const { userId, sessionName } = req.query;
    const key = `${userId}-${sessionName}`;
    res.send(m.getStatus(key));
});

// Send message
app.post('/send', async (req, res) => {
    try {
        const { userId, sessionName, number, message } = req.body;
        const key = `${userId}-${sessionName}`;
        const client = m.get(key);

        if (!client || m.getStatus(key) !== "ready")
            return res.send("Session not ready");

        await client.sendMessage(number + "@c.us", message);
        res.send("Message Sent ✅");
    } catch (err) {
        console.error(err);
        res.send("Error sending message");
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Started"));
