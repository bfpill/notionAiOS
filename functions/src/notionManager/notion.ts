import { Client } from "@notionhq/client"
import * as functions from "firebase-functions"

const notionKey = functions.config().notion.token;
const databaseId = functions.config().notion.database_id;

console.log('Notion token:', notionKey);
console.log('Database ID:', databaseId);

const notion = new Client({ auth: notionKey })

export function getNotion () { 
    return notion;
}

export function getDatabaseId () : string {
    if(databaseId){ 
        return databaseId;
    }

    return "no-id-for-you-little-man"
}