import notionBlockServices from "../services/blockServices.js";
import notionPageServices from "../services/pageServices.js";
import { Page } from "../projecthandler/interfaces.js";
import { getNotion } from "../notionManager/notion.js";
import { initializeApp } from "firebase/app"

import dotenv from "dotenv"
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getFirestore } from "firebase/firestore"
import { projectID } from "firebase-functions/params";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "v3rv-notionaios.firebaseapp.com",
    projectId: "v3rv-notionaios",
    storageBucket: "v3rv-notionaios.appspot.com",
    messagingSenderId: "169546801011",
    appId: "1:169546801011:web:7b62ff0c11c583f934ef06",
    measurementId: "G-TLW05P28TT"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore()

dotenv.config()
console.log("Setting up firebase config")

const functions = getFunctions()

// Point to the Functions emulator
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

//get from local instance
const notion = getNotion()


//@todo change later as shit starts to work
let pages;

console.log("connector initialized")
const getDownloadLink = async (req, res) => {
    const { body } = req
    if (
        !body.name
    ) {
        return fourHunnid(res)
    }
    const name: string = body.name;
    let files = pages.getNodeByName(name) ?? pages.tree

    console.log(files)
    const generateFiles = httpsCallable(functions, "generateFiles");
    try {
        const result = await generateFiles({ json: files, name: name })

        const data = result.data;
        res.status(201).send({ status: "OK", data: { data } });

    } catch (e: any) {
        res.status(201).send({ status: "ERROR", error: { e } });
    }
};

const createProject = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName
    ) {
        return fourHunnid(res)
    }
    const { userId, projectName } = body;
    const messageResponse = await notionPageServices.createProject(db, notion, userId, projectName);
   
    res.status(201).send({ status: "OK", data: { messageResponse } });
}

const createPage = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName ||
        !body.parentName ||
        !body.pageName ||
        !body.type

    ) {
        return fourHunnid(res)
    }
    const userId = body.userId
    const projectName = body.projectName
    const parentName = body.parentName
    const pageName = body.pageName
    const type = body.type

    const messageResponse = await notionPageServices.createPage(db, notion, userId, projectName, parentName, pageName, type);

    res.status(201).send({ status: "OK", data: { messageResponse } });
}

const getPages = async (req, res) => {
    const { body } = req
    if (
        !body.pageName
    ) {
        return fourHunnid(res)
    }
    const { pageName } = body
    const messageResponse = notionPageServices.getPagesTree(pages, pageName);
    res.status(201).send({ status: "OK", data: { messageResponse } });
}

const updateProperty = async (req, res) => {
    const { body } = req
    if (
        !body.pageId ||
        !body.propertyName ||
        !body.content
    ) {
        return fourHunnid(res)
    }
    const { pageId, propertyName, content } = body;
    const messageResponse = await notionBlockServices.updateProperty(pageId, propertyName, content);

    res.status(201).send({ status: "OK", data: { messageResponse } });
};

const getChildBlocks = async (req, res) => {
    const { body } = req
    if (
        !body.pageId
    ) {
        return fourHunnid(res);
    }
    const { pageId } = body;
    const messageResponse = await notionBlockServices.getChildBlocks(pageId);

    res.status(201).send({ status: "OK", data: { messageResponse } });
};

const blockActions = async (req, res) => {
    const { body } = req
    if (
        !body.projectId ||
        !body.command ||
        !body.blockId
    ) {
        return fourHunnid(res);
    }

    let messageResponse: any;

    if (body.command === "DELETE LINES") {
        const blockId = body.blockId
        const startLine = body.startLine
        const endLine = body.endLine
        messageResponse = await notionBlockServices.deleteCodeBlockLines(blockId, startLine, endLine);
    }

    else if (body.command === "REPLACE LINES") {
        const blockId = body.blockId
        const codeToInsert = body.code
        const startLine = body.startLine
        const endLine = body.endLine
        messageResponse = await notionBlockServices.replaceCodeBlockLines(blockId, codeToInsert, startLine, endLine);
    }

    else {
        messageResponse = { completed: false, result: "Could not parse command" }
    }

    if (messageResponse[0]) {
        res.status(201).send({ status: "OK", data: { messageResponse } });
    }

    else if (!messageResponse[0]) {
        res.status(201).send({ status: "Error", data: { messageResponse } });
    }

}

const pageActions = async (req, res) => {
    const { body } = req
    if (
        !body.projectId ||
        !body.command ||
        !((body.pageName && body.content) || (body.blockId))
    ) {
        return fourHunnid(res);
    }

    let messageResponse: { worked: boolean, message: {} };

    if (body.command === "DELETE BLOCK") {
        const blockId = body.blockId
        messageResponse = await notionBlockServices.deleteBlock(blockId);
    }

    else if (body.command === "ADD BLOCK") {
        const pageName = body.pageName

        const page: Page = await notionPageServices.getPage(db, body.projectId, pageName)

        if (page && page.type !== "folder") {
            const content = body.content
            notionBlockServices.addBlock(page, pageName, content)
            notionPageServices.updateProject(db, body.projectId, pageName, content)
            console.log(messageResponse)
        }
        else {
            messageResponse = { worked: false, message: { error: "page was not a file or did not exist" } }
        }
    }

    res.status(201).send({ status: "OK", data: { messageResponse } });
}

const getBlockCode = async (req, res) => {
    const { body } = req
    if (
        !body.blockId
    ) {
        return fourHunnid(res);
    }
    const { blockId } = body;
    const messageResponse = await notionBlockServices.getBlockAsArray(blockId);

    res.status(201).send({ status: "OK", data: { messageResponse } });
};

const fourHunnid = (res: any) => {
    res
        .status(400)
        .send({
            status: "FAILED",
            data: {
                error:
                    "Error becuase you prolly forgot a property"
            },
        });
}

export default {
    //page functions
    createPage,
    getPages,

    //block function
    updateProperty,
    getChildBlocks,
    getBlockCode,
    blockActions,
    pageActions,

    createProject,

    getDownloadLink
};
