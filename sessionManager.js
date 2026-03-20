const { Client, LocalAuth } = require('whatsapp-web.js');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'sql201.infinityfree.com',
    user: 'if0_40736397',
    password: 'Mustak7070',
    database: 'if0_40736397_mysoftware'
};

class Manager {
    constructor() {
        this.sessions = {};
        this.status = {};
        this.qr = {};
    }

    async create(userId, sessionName) {
        const key = `${userId}-${sessionName}`;
        if (this.sessions[key]) return this.sessions[key];

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: key,
                dataPath: './sessions'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        this.status[key] = "starting";

        client.on('qr', (q) => {
            this.qr[key] = q;
            this.status[key] = "qr";
            this.saveStatus(userId, sessionName, "qr");
        });

        client.on('ready', async () => {
            this.status[key] = "ready";
            this.qr[key] = null;
            const session = await client.authStrategy.exportSession();
            await this.saveSession(userId, sessionName, session, "ready");
        });

        client.on('disconnected', () => {
            this.status[key] = "reconnecting";
            this.saveStatus(userId, sessionName, "reconnecting");
            setTimeout(() => client.initialize(), 5000);
        });

        await client.initialize();
        this.sessions[key] = client;
        return client;
    }

    get(key) { return this.sessions[key]; }
    getQR(key) { return this.qr[key] || "NO_QR"; }
    getStatus(key) { return this.status[key] || "not_found"; }

    async saveSession(userId, sessionName, session, status) {
        try {
            const conn = await mysql.createConnection(dbConfig);
            await conn.execute(
                'REPLACE INTO whatsapp_sessions (mobile, session_name, session_data, status) VALUES (?, ?, ?, ?)',
                [userId, sessionName, JSON.stringify(session), status]
            );
            await conn.end();
        } catch (err) {
            console.error("MySQL save error:", err);
        }
    }

    async saveStatus(userId, sessionName, status) {
        try {
            const conn = await mysql.createConnection(dbConfig);
            await conn.execute(
                'UPDATE whatsapp_sessions SET status=? WHERE mobile=? AND session_name=?',
                [status, userId, sessionName]
            );
            await conn.end();
        } catch (err) {
            console.error("MySQL status error:", err);
        }
    }
}

module.exports = new Manager();
