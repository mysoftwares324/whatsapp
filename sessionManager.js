const { Client, LocalAuth } = require('whatsapp-web.js');

class Manager {
    constructor() {
        this.sessions = {};
        this.status = {};
        this.qr = {};
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
                args: ['--no-sandbox']
            }
        });

        this.status[name] = "starting";

        client.on('qr', (q) => {
            this.qr[name] = q;
            this.status[name] = "qr";
        });

        client.on('ready', () => {
            this.status[name] = "ready";
            this.qr[name] = null;
        });

        client.on('disconnected', () => {
            this.status[name] = "reconnecting";
            setTimeout(() => client.initialize(), 5000);
        });

        client.initialize();
        this.sessions[name] = client;
        return client;
    }

    get(name){ return this.sessions[name]; }
    getQR(name){ return this.qr[name] || "NO_QR"; }
    getStatus(name){ return this.status[name] || "not_found"; }
}

module.exports = new Manager();