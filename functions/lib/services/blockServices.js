import { extractCode, toArray, deleteLines, insertCodeByLine } from "./codeBlockFunctions.js";
import { getNotion } from "../notionManager/notion.js";
//get from local instance
const notion = getNotion();
async function updateProperty(pageId, propertyName, content) {
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
        });
        return response;
    }
    catch (error) {
        return error;
    }
}
async function getChildBlocks(blockId) {
    try {
        const response = await notion.blocks.children.list({
            block_id: blockId,
            page_size: 50,
        });
        return response;
    }
    catch (error) {
        return error;
    }
}
async function updateCodeBlock(blockId, code) {
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
            }
        });
        return response;
    }
    catch (error) {
        console.log(error);
        return error;
    }
}
async function getBlock(blockId) {
    return await notion.blocks.retrieve({
        block_id: blockId
    });
}
async function addBlock(pages, pageName, code) {
    let page = pages.getNodeByName(pageName);
    if (!page) {
        return { worked: false, message: { error: ("No page with name: " + pageName) } };
    }
    const id = page.id;
    const language = page.type;
    try {
        const messageResponse = await notion.blocks.children.append({
            block_id: id,
            children: [
                {
                    //...other keys excluded
                    type: "code",
                    //...other keys excluded
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
                }
            ],
        });
        pages.updatePage(page, code);
        console.log(page);
        return { worked: true, message: { blockId: messageResponse.results[0].id, content: messageResponse.results[0]["code"].rich_text[0].text.content } };
    }
    catch (e) {
        return { worked: false, message: { error: e } };
    }
}
async function deleteBlock(blockId) {
    try {
        await notion.blocks.delete({
            block_id: blockId
        });
    }
    catch (e) {
        return { worked: false, message: e };
    }
    return { worked: true, message: ("Block " + blockId + " deleted") };
}
async function replaceCodeBlockLines(blockId, codeToInsert, startLine, endLine) {
    const oldCode = await getBlockAsArray(blockId);
    let result = deleteLines(oldCode, startLine, endLine);
    if (result[0]) {
        // oOOOooOoH scary be careful with this guy
        // surely there is a better way to do this... although it should be fine...
        const newCode = insertCodeByLine(result[1], codeToInsert, startLine);
        //Tell notion to update the block
        updateCodeBlock(blockId, newCode.join("\n"));
        console.log(newCode);
        return [true, newCode];
    }
    return result;
}
async function getBlockAsArray(blockId) {
    //get the block from notion, suck the code out, then make it an array
    return toArray(extractCode(await getBlock(blockId)), "\n");
}
async function deleteCodeBlockLines(blockId, startLine, endLine) {
    const oldCode = await getBlockAsArray(blockId);
    let result = deleteLines(oldCode, startLine, endLine);
    if (result[0]) {
        const updatedCode = result[1].join("\n");
        updateCodeBlock(blockId, updatedCode);
        return result;
    }
    return ([false, "Could not replace lines " + startLine + " -> " + endLine]);
}
export default {
    updateProperty,
    getChildBlocks,
    updateCodeBlock,
    getBlock,
    getBlockAsArray,
    replaceCodeBlockLines,
    deleteBlock,
    deleteCodeBlockLines,
    addBlock,
};
//# sourceMappingURL=blockServices.js.map