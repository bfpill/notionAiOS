import { Client } from "@notionhq/client";
import { Page, Block, CreatePageRequest } from "../../projecthandler/interfaces.js";
import { getIcon } from "../notion_helpers/iconManager.js";
import { parseLanguage } from "../notion_helpers/languageManager.js";
import { getNotion } from "../../initialize.js";

export async function addPageToNotion(page: CreatePageRequest, parentId: string, parentType: string, creatorId: string) {
    const notion = getNotion()
    const icon = await getIcon(page.type)

    let response;

    const language: any = parseLanguage(page.type)

    page.content = page.content ?? ""
    try {
        if (parentType !== "root") {
            if (!parentType || (parentType !== "folder" && parentType !== "root" && parentType !== "project")) {
                return { Error: "Could not add page, parent was not a folder or was outside the project scope" }
            }

            response = await notion.pages.create({
                "icon": {
                    "type": "external",
                    "external": {
                        "url": icon
                    }
                },
                "parent": {
                    "type": "page_id",
                    "page_id": parentId
                },
                "properties": {
                    "title": {
                        "title": [
                            {
                                "text": {
                                    "content": page.name
                                }
                            }
                        ]
                    },
                },
                children: [],
            })

            const block = await notion.blocks.children.append({
                block_id: response.id,
                children: [{
                    code: {
                        "caption": [],
                        "rich_text": [{
                            "type": "text",
                            "text": {
                                "content": page.content
                            }
                        }],
                        language: language
                    }
                }]
            })

            return { id: response.id, codeId: block.results[0].id }
        }
        else {
            console.log("adding to root")
            response = await notion.pages.create({
                "icon": {
                    "type": "external",
                    "external": {
                        "url": icon
                    }
                },
                "parent": {
                    "type": "database_id",
                    "database_id": parentId
                },
                "properties": {
                    "Name": {
                        "title": [
                            {
                                "text": {
                                    "content": page.name
                                }
                            }
                        ]
                    },
                    "Type": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": page.type
                                }
                            }
                        ]
                    },
                    "creator": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": creatorId,
                                },
                                "annotations": {
                                    "italic": true,
                                    "code": true
                                }
                            }
                        ]
                    },
                    "download": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": "nothing here yet!"
                                },
                                "annotations": {
                                    "underline": true
                                }
                            }
                        ]
                    }
                },
                "children": []
            })
        }
    } catch (error) {
        return undefined
    }

    return response;
}

export async function updateCodeInNotion(page: Page, code: string): Promise<any> {
    const notion = getNotion()
    const id = page.codeId

    if (!id) return new Error("Could not find ID")
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

async function updateProjectDownloadLink(url: string, projectId: string) {
    const notion = getNotion()

    await notion.pages.update({
        page_id: projectId,
        properties: {
            download: {
                rich_text: [
                    {
                        // fancy emoji here - watch out it's invisible
                        text: {
                            content: "❇️ ( click me )",
                            link: { url: url }
                        },
                        annotations: {
                            underline: true
                        }
                    }
                ]
            }
        },
    });
}

async function updateProjectTags(tags: any, projectId: string) {
    const notion = getNotion()
    await notion.pages.update({
        page_id: projectId,
        properties: {
            Tags: {
                multi_select: tags
            }
        },
    });
}

async function getBlock(notion: Client, blockId: string): Promise<Block> {
    return await notion.blocks.retrieve({
        block_id: blockId
    })
}

export default { addPageToNotion, updateCodeInNotion, updateProjectDownloadLink, updateProjectTags }