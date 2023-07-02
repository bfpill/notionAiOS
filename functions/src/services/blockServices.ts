import { extractCode, toArray, deleteLines, insertCodeByLine } from "./codeBlockFunctions.js"
import { Block } from "../projecthandler/interfaces.js"
import { getNotion } from "../notionManager/notion.js";
import { Page } from "../projecthandler/PageTree.js";
import { parseLanguage } from "./notion_helpers/languageManager.js";

//get from local instance
const notion = getNotion()

async function getBlock(blockId: string): Promise<Block> {
    return await notion.blocks.retrieve({
        block_id: blockId
    })
}

async function updateCodeInNotion(page: Page, code: string): Promise<any> {
    const id = page.codeId  

    if(!id) return new Error("Could not find ID")
    const language: any = parseLanguage(page.type)

    try {
        const messageResponse = await notion.blocks.update({
            block_id: id,
            type: "code",
            code: {
                "caption": [],
                "rich_text": [{
                    "type": "text",
                    "text": {
                        "content": code
                    }
                }],
                language: language
            }
        })

        return messageResponse;
    } catch (e: any) {
        return e;
    }
}

async function deleteBlock(blockId: string): Promise<{ worked: boolean, message: any }> {
    try {
        await notion.blocks.delete({
            block_id: blockId
        })
    } catch (e: any) {
        return { worked: false, message: e };
    }
    return { worked: true, message: ("Block " + blockId + " deleted") };
}


//this one needs to be moved
function replaceLines(page: Page, newCode: string, startLine: number, endLine: number) {
    try{ 
        const oldCode = toArray(page.content, "\n")
        let deletedLines = deleteLines(oldCode, startLine, endLine)
        if (deletedLines) {
            const newCodeArray = insertCodeByLine(deletedLines, newCode, startLine) as string[]
            newCode = newCodeArray.join("\n")
            return newCode;
        }
        return undefined
    } catch (error: any){ 
        console.log(error)
        return undefined;
    }
}

async function getBlockAsArray(blockId: string): Promise<Array<string>> {
    //get the block from notion, suck the code out, then make it an array
    return toArray(extractCode(await getBlock(blockId)), "\n")
}

export default {
    getBlock,
    getBlockAsArray,
    deleteBlock,
    updateCodeInNotion,
    replaceLines
}
