import { Client } from "@notionhq/client"
import * as dotenv from 'dotenv';

// Get environment variables
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const databaseId = process.env.NOTION_DATABASE_ID

export function getNotion () { 
    return notion;
}

export function getDatabaseId () : string {
    if(databaseId){ 
        return databaseId;
    }

    return "no-id-for-you-little-man"
}