import { Client } from "@notionhq/client"
import * as functions from "firebase-functions"
import * as fb from "firebase-functions"
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const notionKey = functions.config().notion.token;
const databaseId = functions.config().notion.database_id;

console.log('Notion token:', notionKey);
console.log('Database ID:', databaseId);

export const notion = new Client({ auth: notionKey })

export function getDatabaseId () : string {
    if(databaseId){ 
        return databaseId;
    }

    return "no-id-for-you-little-man"
}

const firebaseConfig = {
    apiKey: fb.config().fb.api_key,
    authDomain: "v3rv-notionaios.firebaseapp.com",
    projectId: "v3rv-notionaios",
    storageBucket: "v3rv-notionaios.appspot.com",
    messagingSenderId: "169546801011",
    appId: "1:169546801011:web:7b62ff0c11c583f934ef06",
    measurementId: "G-TLW05P28TT"
};

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)
const db = getFirestore()

export const getDb = () => { 
    return db
}

export const getNotion = () => { 
    return notion
}

export const getFbStorage = () => {
    return storage
}
