import { Client } from "@notionhq/client";
import PageTree from "./PageTree";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function createPage(notion: Client, pages: PageTree, parentId: string, pageName: string, type: string) {

    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl

    let response;

    if (pages.getNodeByName(pageName) !== "Name does not exist.") {
        return { Error: "Page name already exists, no duplicates please" };
    }

    if (pages.getNodeByName(parentId) !== "Name does not exist.") {
        parentId = pages.getNodeByName(parentId)["id"]
    }

    let parentName = pages.getNodeById(parentId)?.name
    //Quality of life, may be something to tell the AI about, maybe not
    if (IDisRoot(parentId)) {
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
                "database_id": DATABASEID
            },
            "properties": {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": pageName
                            }
                        }
                    ]
                },
                "Type": {
                    "rich_text": [
                        {
                            "text": {
                                "content": type
                            }
                        }
                    ]
                }
            },
            "children": [
            ]
        })
    }

    else {
        try {
            const parentType = pages.getNodeById(parentId)?.type

            if (parentType !== "folder") {
                console.log(parentType)
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
                                    "content": pageName
                                }
                            }
                        ]
                    }
                },
            })
        } catch (e: any) {
            if (e instanceof TypeError) {
                return ("The provided parentID does not exist: " + e)
            }
            return ("Error: " + e)
        }
    }

    pages.add({ name: pageName, id: response.id, type: type }, parentName )

    return { "pageId": response.id, "pageParent": response.parent };
}

async function getPage(notion: Client, pageId: string): Promise<any> {
    const page = await notion.pages.retrieve({
        page_id: pageId
    })

    return page
}

function getPageName(page: any) {
    try {
        return page["properties"].Name.title[0].text.content;
    } catch (e: any) {
        if (e instanceof TypeError) {
            try {
                return page["properties"].title.title[0].text.content;
            } catch (e: any) {
                return "Could not get Page name";
            }
        }
    }

}

function IDisRoot(id: string): boolean {
    if (id.toLowerCase() === "root-node") {
        console.log("id" + id)
        return true;
    }
    return false;
}

function getPagesTree (pages: PageTree, rootPageName: string) { 
    if(rootPageName.toLowerCase() === 'root'){
        pages.printTree()
    }
    else{ 
        const page = pages.getNodeByName(rootPageName)
        pages.printTree(page)
    }
}

export default { createPage, getPagesTree}