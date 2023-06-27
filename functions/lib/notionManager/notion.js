import { Client } from "@notionhq/client";
import * as dotenv from 'dotenv';
import * as functions from "firebase-functions";
// Get environment variables
dotenv.config();
const notionKey = functions.config().notion.token;
const databaseId = functions.config().notion.database_id;
console.log('Notion token:', notionKey);
console.log('Database ID:', databaseId);
const notion = new Client({ auth: notionKey });
console.log('Notion token:', process.env.NOTION_TOKEN);
console.log('Database ID:', process.env.NOTION_DATABASE_ID);
export function getNotion() {
    return notion;
}
export function getDatabaseId() {
    if (databaseId) {
        return databaseId;
    }
    return "no-id-for-you-little-man";
}
//# sourceMappingURL=notion.js.map