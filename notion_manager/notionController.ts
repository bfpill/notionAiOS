import notionBlockServices from "./blockServices";
import notionPageServices from "./pageServices";
import { PageTree } from "./PageTree";
import { getNotion } from "./notion";

import { getApp, initializeApp } from "firebase/app"
import dotenv from "dotenv"
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

//get from local instance
const notion = getNotion()
const pages = new PageTree()

dotenv.config()

// Initialize Firebase
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
const functions = getFunctions(getApp())

// Point to the Functions emulator
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

const getDownloadLink = async (req, res) => {
    const { body } = req
    if (
        !body.name
    ) {
        return fourHunnid(res)
    }
    const name: string = body.name;
    // Call your Cloud Function
    const generateFiles = httpsCallable(functions, "generateFiles");
    try{ 
        generateFiles({ json: pages.tree, name: name })
        .then((result) => {
            const data = result.data;
            res.status(201).send({ status: "OK", data: { data } });
        })
    } catch (e: any){
        res.status(201).send({ status: "ERROR", error: { e } });
    }
};

const createPage = async (req, res) => {
    const { body } = req
    if (
        !body.parentName ||
        !body.pageName ||
        !body.type
    ) {
        return fourHunnid(res)
    }
    const { parentName, pageName, type } = body;
    const messageResponse = await notionPageServices.createPage(notion, pages, parentName, pageName, type);

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
    console.log("I am actually being used!!")
    const messageResponse = await notionBlockServices.getChildBlocks(pageId);

    res.status(201).send({ status: "OK", data: { messageResponse } });
};

const blockActions = async (req, res) => {
    const { body } = req
    if (
        !body.command ||
        !body.blockId
    ) {
        return fourHunnid(res);
    }

    let messageResponse: any;

    if (body.command === "DELETE LINES") {
        const { _, blockId, startLine, endLine } = body
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
    console.log("page actions")
    const { body } = req
    if (
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
        const content = body.content
        console.log(pageName, content)
        messageResponse = await notionBlockServices.addBlock(pages, pageName, content);
        console.log(messageResponse)
    }

    else {
        messageResponse = { worked: false, message: { error: "Could not parse command" } }
    }

    if (messageResponse.worked) {
        res.status(201).send({ status: "OK", data: { messageResponse } });
    }

    else {
        res.status(201).send({ status: "Error", data: { messageResponse } });
    }
}

const deleteBlock = async (req, res) => {
    const { body } = req
    if (
        !body.blockId
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                        "Error becuase you probably forgot a property"
                },
            });
        return;
    }
    const { blockId, lineNumber, code } = body;
    console.log(blockId, lineNumber, code)
    const messageResponse = await notionBlockServices.deleteBlock(blockId);

    res.status(201).send({ status: "OK", data: { messageResponse } });
};

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
    deleteBlock,
    blockActions,
    pageActions,


    getDownloadLink
};
