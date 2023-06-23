import notionBlockServices from "./blockServices";
import notionPageServices from "./pageServices";
import PageMap from "./pageMap";
import { getNotion, getDatabaseId } from "./notion";

//get from local instance
const notion = getNotion()
const pages = new PageMap(getDatabaseId())

const createPage = async (req, res) => {
    const { body } = req
    if (
        !body.parentId || 
        !body.pageName ||
        !body.type
    ) {
        return fourHunnid(res)
    }
    const { parentId, pageName, type} = body;
    const messageResponse =  await notionPageServices.createPage(notion, pages, parentId, pageName, type);

    res.status(201).send({ status: "OK", data: {messageResponse} });
}

const getPages = async (req, res) => {
    const { body } = req
    if (
        !body.pageId
    ) {
        return fourHunnid(res)
    }
    const { pageId } = body
    const messageResponse =  await notionPageServices.getPagesTree(notion, pages, pageId);
    res.status(201).send({ status: "OK", data: {messageResponse} });
}

const getPageProperties = async (req, res) => {
    const { body } = req
    if (
        !body.pageId
    ) {
        return fourHunnid(res)
    }
    const { pageId } = body;
    const messageResponse =  await notionPageServices.getPageInfo(notion, pageId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const updateProperty = async (req, res) => {
    const { body } = req
    if (
        !body.pageId ||
        !body.propertyName ||
        !body.content
    ) {
        return fourHunnid(res)
    }
    const { pageId, propertyName, content} = body;
    const messageResponse =  await notionBlockServices.updateProperty(pageId, propertyName, content);

    res.status(201).send({ status: "OK", data: {messageResponse} });
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
    const messageResponse =  await notionBlockServices.getChildBlocks(pageId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const updateCodeBlock = async (req, res) => { 
    const { body } = req
    if (
        !body.command || 
        !body.blockId
    ) {
        return fourHunnid(res);
    }

    let messageResponse: any;

    if(body.command === "DELETE LINES") { 
        const { _, blockId, startLine, endLine } = body
        messageResponse =  await notionBlockServices.deleteCodeBlockLines(blockId, startLine, endLine);
    }
  
    else if (body.command === "REPLACE LINES") { 
        const blockId = body.blockId
        const codeToInsert = body.code
        const startLine = body.startLine
        const endLine = body.endLine
        messageResponse =  await notionBlockServices.replaceCodeBlockLines(blockId, codeToInsert, startLine, endLine);
    }

    else { 
        messageResponse =  {completed: false, result: "Could not parse command"}
    }

    if(messageResponse[0]){
        res.status(201).send({ status: "OK", data: {messageResponse} });
    }

    else if (!messageResponse[0]){
        res.status(201).send({ status: "Error", data: {messageResponse} });
    }

}

const pageActions = async (req, res) => {
    console.log("page actions")
    const { body } = req
    if (
        !body.command ||
        !((body.pageId && body.content && body.language) || (body.blockId))
    ) {
        return fourHunnid(res);
    }

    let messageResponse: any;

    if(body.command === "DELETE BLOCK") { 
        const blockId = body.blockId
        messageResponse =  await notionBlockServices.deleteBlock(blockId);
    }
  
    else if (body.command === "ADD BLOCK") { 
        const pageId = body.pageId
        const content = body.content
        const language = body.language
        console.log(pageId, content)
        messageResponse =  await notionBlockServices.addBlock(pageId, content, language);
    }

    else { 
        messageResponse =  {completed: false, result: "Could not parse command"}
    }

    if(messageResponse[0]){
        res.status(201).send({ status: "OK", data: {messageResponse} });
    }

    else if (!messageResponse[0]){
        res.status(201).send({ status: "Error", data: {messageResponse} });
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
    console.log(blockId, lineNumber, code )
    const messageResponse =  await notionBlockServices.deleteBlock(blockId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const getBlockCode = async (req, res) => {
    const { body } = req
    if (
        !body.blockId
    ) {
        return fourHunnid(res);
    }
    const { blockId} = body;
    const messageResponse =  await notionBlockServices.getBlockAsArray(blockId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
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
    getPageProperties,

    //block function
    updateProperty,
    getChildBlocks,
    getBlockCode,
    deleteBlock, 
    updateCodeBlock, 
    pageActions
};
