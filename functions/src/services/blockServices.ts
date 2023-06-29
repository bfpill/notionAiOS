import { extractCode, toArray, deleteLines, insertCodeByLine } from "./codeBlockFunctions.js"
import { Block } from "../projecthandler/interfaces.js"
import { getNotion } from "../notionManager/notion.js";
import { Page } from "../projecthandler/PageTree.js";
import * as pages from "../projecthandler/PageTree.js"

const languages: string[] = [
    "abap", "agda", "arduino", "assembly", "bash", "basic", "bnf", "c", "c#", "c++", "clojure", "coffeescript", "coq", "css", 
    "dart", "dhall", "diff", "docker", "ebnf", "elixir", "elm", "erlang", "f#", "flow", "fortran", "gherkin", "glsl", "go", 
    "graphql", "groovy", "haskell", "html", "idris", "java", "javascript", "json", "julia", "kotlin", "latex", "less", "lisp", 
    "livescript", "llvm ir", "lua", "makefile", "markdown", "markup", "matlab", "mathematica", "mermaid", "nix", "objective-c", 
    "ocaml", "pascal", "perl", "php", "plain text", "powershell", "prolog", "protobuf", "purescript", "python", "r", "racket", 
    "reason", "ruby", "rust", "sass", "scala", "scheme", "scss", "shell", "solidity", "sql", "swift", "toml", "typescript", 
    "vb.net", "verilog", "vhdl", "visual basic", "webassembly", "xml", "yaml"
];

//get from local instance
const notion = getNotion()

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

async function getChildBlocks(blockId: string) {
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

const parseLanguage = (language: string) => { 
    if(!languages.includes(language)){
        return "javascript"
    }
    return language
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

async function addBlock(page: Page, pageName: string, code: string): Promise<{ worked: boolean, message: any }> {

    const id = page.id
    const language: any = parseLanguage(page.type)

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
        })

        return { worked: true, message: messageResponse};
    } catch (e: any) {
        return { worked: false, message: { error: e } };
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

async function replaceCodeBlockLines(blockId: string, codeToInsert: string, startLine: number, endLine: number): Promise<any> {
    const oldCode = await getBlockAsArray(blockId)
    let result = deleteLines(oldCode, startLine, endLine)
    if (result[0]) {
        // oOOOooOoH scary be careful with this guy
        // surely there is a better way to do this... although it should be fine...
        const newCode = insertCodeByLine(result[1], codeToInsert, startLine) as string[]

        //Tell notion to update the block
        updateCodeBlock(blockId, newCode.join("\n"))

        console.log(newCode)
        return [true, newCode];
    }
    return result;

}

async function getBlockAsArray(blockId: string): Promise<Array<string>> {
    //get the block from notion, suck the code out, then make it an array
    return toArray(extractCode(await getBlock(blockId)), "\n")
}

async function deleteCodeBlockLines(blockId: string, startLine: number, endLine: number): Promise<any> {
    const oldCode = await getBlockAsArray(blockId);
    let result = deleteLines(oldCode, startLine, endLine)

    if (result[0]) {
        const updatedCode = result[1].join("\n")
        updateCodeBlock(blockId, updatedCode)
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
}
