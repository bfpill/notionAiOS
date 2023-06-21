import { Client } from "@notionhq/client"
import * as dotenv from 'dotenv';
import { executeInstruction } from "./instructionHandler";
import { getCodeBlock, getCodeBlockProperties, extractCode, toArray } from "./codeBlockFunctions"
import { Block, CodeBlock, CodeProperties } from "./interfaces"
// Get environment variables
dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const databaseId = process.env.NOTION_DATABASE_ID

async function updateProperty(pageId: string, propertyName: string, content: string) {
    try {
        console.log("yeet")
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

async function updateCodeBlockHandler(blockId: string, instructions: string): Promise<CodeBlock> {
    const block: Block = await getBlock(blockId)

    // Get the old code out of the block and splice in the new code
    const oldCode: string = extractCode(block)

    let codeHolder = toArray(oldCode, "\n");
    // Turn the instructions string into an array of single commands
    const instructionsArray = toArray(instructions, ";")
    instructionsArray.forEach((instruction) => {
        const back = executeInstruction(codeHolder, instruction);
        if (!back[0]) {
            console.log(back[1])
        }
        else{ 
            //update codeHolder
            console.log("Updated codeHolder" + back[1])
            codeHolder = back[1] as string[];
        }
    })

    // Turn back to a string
    const newCode = codeHolder.join("\n")
    // Update the block in notion
    updateCodeBlock(blockId, newCode)

    const properties = getCodeBlockProperties(block)
    const codeBlock: CodeBlock = { code: newCode, properties: properties }

    return codeBlock;
}

export default {
    updateProperty, getChildBlocks, updateCodeBlock,
    getBlock, updateCodeBlockHandler, deleteBlock
}