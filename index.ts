import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import chalk from 'chalk'
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import cors from 'cors';


// Get environment variables
dotenv.config() 

// Import routes
import routes from "./notion_manager/routes"

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000; 

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
  console.log("HIT")
  const filepath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ai-plugin.json');
  res.sendFile(filepath);
})

app.get('/openapi.yaml', (req, res) => {
  const filepath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'openapi.yaml');
  res.sendFile(filepath);
})

// Mount routes
app.use('/notion_manager', routes);

// Start server
app.listen(PORT, () => {
  console.log(chalk.yellow(`Started Notion Manager ${PORT}`));
});