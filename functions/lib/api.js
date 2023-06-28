import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import cors from 'cors';
import * as functions from 'firebase-functions';
// Get environment variables
dotenv.config();
// Import routes
import routes from "./routes/routes.js";
// Create Express app
const app = express();
// Set up middleware
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.get('/.well-known/ai-plugin.json', (req, res) => {
    console.log("HIT");
    const filepath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ai-plugin.json');
    res.sendFile(filepath);
});
app.get('/openapi.yaml', (req, res) => {
    const filepath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'openapi.yaml');
    res.sendFile(filepath);
});
// Mount routes
app.use('/notion_manager', routes);
export const api = functions.https.onRequest(app);
//# sourceMappingURL=api.js.map