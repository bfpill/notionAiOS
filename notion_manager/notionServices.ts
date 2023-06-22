import { Client } from "@notionhq/client"
import * as dotenv from 'dotenv';
import { executeInstruction } from "./instructionHandler";
import { getCodeBlock, getCodeBlockProperties, extractCode, toArray, deleteLines, insertCodeByLine } from "./codeBlockFunctions"
import { Block, CodeBlock, CodeProperties } from "./interfaces"
import { start } from "repl";
// Get environment variables
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const databaseId = process.env.NOTION_DATABASE_ID

async function updateProperty(pageId: string, propertyName: string, content: string) {
    try {
        const response = await notion.pages.update({
            page_id: pageId,
            properties: {
                [propertyName]: {
                    "rich_text": [
                        {
                            "text": {
                                "content": content
                            }
                        }
                    ]
                },
                title: {
                    title: [
                        {
                            "text": {
                                "content": content
                            }
                        }
                    ]
                },
            },
        })
        return response
    } catch (error) {
        return error
    }
}

async function getChildBlocks(blockId: string, content: string) {
    try {
        const response = await notion.blocks.children.list({
            block_id: blockId,
            page_size: 50,
        })
        return response;
    } catch (error) {
        return error;
    }
}

async function updateCodeBlock(blockId: string, code: string) {
    try {
        const response = await notion.blocks.update({
            block_id: blockId,
            code: {
                caption: [],
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": code,
                            "link": null
                        },
                        "annotations": {
                            "bold": false,
                            "italic": false,
                            "strikethrough": false,
                            "underline": false,
                            "code": false,
                            "color": "default"
                        },
                    }
                ],
                "language": "javascript"
            }
        })
        return response;
    } catch (error) {
        console.log(error)
        return error;
    }
}

async function getBlock(blockId: string): Promise<Block> {
    return await notion.blocks.retrieve({
        block_id: blockId
    })
}

async function deleteBlock(blockId: string): Promise<string> {
    await notion.blocks.delete({
        block_id: blockId
    })

    return "Block " + blockId + " deleted";
}

async function updateCodeViaInstructions(blockId: string, instructions: string): Promise<(boolean | string[])[]> {
    const block: Block = await getBlock(blockId)

    // Get the old code out of the block and splice in the new code
    const oldCode: string = extractCode(block)
    let codeHolder = toArray(oldCode, "\n");

    // Turn the instructions string into an array of single commands
    const instructionsArray = toArray(instructions, ";")
1
    for(const element of instructionsArray){
        const res: any = executeInstruction(codeHolder, element);
        if (!res[0]) {
            console.log(res[0])
            return ([false, res[1]])
        }
        else if(res[0]) {
            //update codeHolder
            codeHolder = res[1];
        }
    }

    let newCode;
    try {
        // Turn back to a string
        newCode = codeHolder.join("\n")
    } catch (e: any){
        console.log(e)
        newCode = " ";
    }

      // Update the block in notion
    updateCodeBlock(blockId, newCode)



   return [true, newCode]
}

async function replaceCodeBlockLines (blockId: string, codeToInsert: string, startLine: number, endLine: number) {
    const result = deleteCodeBlockLines(blockId, startLine, endLine)
    if(result[0]){
        // oOOOooOoH scary be careful with this guy
        // surely there is a better way to do this... although it should be fine...
        const newCode = insertCodeByLine(result[1], codeToInsert, startLine) as string[]
        console.log(newCode)

        //Tell notion to update the block
        updateCodeBlock(blockId, newCode.join("\n"))

        console.log(newCode)
        return [true, newCode]
    }
    return result;

}

async function deleteCodeBlockLines(blockId: string, startLine: number, endLine: number) { 
    const block = await getBlock(blockId);
    let oldCode = toArray(extractCode(block), "\n")
    let result = deleteLines(oldCode, startLine, endLine) 
    
    if(result[0]){
        const updatedCode = result[1].join("\n")
        updateCodeBlock(blockId, updatedCode )
        return result;
    }
    return ([false, "Could not replace lines " + startLine + " -> " + endLine]);
}

export default {
    updateProperty, getChildBlocks, updateCodeBlock,
    getBlock, replaceCodeBlockLines, deleteBlock, deleteCodeBlockLines
}
