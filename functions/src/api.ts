import express from 'express';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import cors from 'cors';
import * as functions from 'firebase-functions';

// Get environment variables
dotenv.config() 

// Import routes
import routes from "./routes/routes.js"

// Create Express app
const app = express();

// Set up middleware
export const corsHeaders: cors.CorsOptions = {
  origin: "*",
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  allowedHeaders: "*",
};

app.use(cors(corsHeaders));
app.use(bodyParser.json());

// Mount routes
app.use('/api', routes);

export const api = functions.https.onRequest(app);
 