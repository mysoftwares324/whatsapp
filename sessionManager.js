const { Client, LocalAuth } = require('whatsapp-web.js');
const mysql = require('mysql2/promise');

class Manager {
    constructor() {
        this.sessions = {};
        this.status = {};
        this.qr = {};
        this.initDB();
    }

    async initDB() {
        this.db = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
    }

    create(name) {
        if (this.sessions[name]) return this.sessions[name];

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: name,
                dataPath: './sessions'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
            }
        });

        this.status[name] = "starting";

        client.on('qr', async (q) => {
            this.qr[name] = q;
            this.status[name] = "qr";
            await this.saveSessionToDB(name, null, "qr");
        });

        client.on('ready', async () => {
            this.status[name] = "ready";
            this.qr[name] = null;
            await this.saveSessionToDB(name, "ready", "ready");
        });

        client.on('disconnected', () => {
            this.status[name] = "reconnecting";
            setTimeout(() => client.initialize(), 5000);
        });

        client.initialize();
        this.sessions[name] = client;
        return client;
    }

    async saveSessionToDB(session_name, mobile=null, status="starting") {
        try {
            await this.db.query(
                `INSERT INTO whatsapp_sessions (mobile, session_name, session_data, status)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status=?`,
                [mobile||"", session_name, JSON.stringify({}), status, status]
            );
        } catch(e) { console.error(e); }
    }

    get(name){ return this.sessions[name]; }
    getQR(name){ return this.qr[name] || "NO_QR"; }
    getStatus(name){ return this.status[name] || "not_found"; }
}

module.exports = new Manager();
