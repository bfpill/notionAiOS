import { Client } from "@notionhq/client";
import { PageTree, Page }from "../projecthandler/PageTree.js";
import { doc, setDoc } from "firebase/firestore";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function createPage(notion: Client, pages: PageTree, parentId: string, pageName: string, type: string) {

    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl

    let response;

    if (pages.getNodeByName(pageName)) {
        return { Error: "Page name already exists, no duplicates please" };
    }

    if (pages.getNodeByName(parentId)) {
        parentId = (pages.getNodeByName(parentId) as Page).id
    }

    let parentName = pages.getNodeById(parentId)?.name
    
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

async function addToFirebase(db: any, notion: Client, parentId: string, pageName: string, type: string) { 
    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl;

    let response;

    // Check if page with the same name already exists
    const pageSnapshot = await db.collection('pages').where('name', '==', pageName).get();
    if (!pageSnapshot.empty) {
        return { Error: "Page name already exists, no duplicates please" };
    }

    // Get parent page document
    const parentDoc = db.collection('pages').doc(parentId);
    const parent = await parentDoc.get();

    if (!parent.exists) {
        return { Error: "Parent page does not exist" };
    }

    const parentData = parent.data();

    if (parentData?.type !== "folder") {
        return { Error: "Could not add page, parent was not a folder or was outside the project scope" };
    }

    // Create page in Notion
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
    });

    // Add page to Firestore
    await db.collection('pages').doc(response.id).set({
        name: pageName,
        id: response.id,
        type: type,
        parentId: parentId
    });

    return { "pageId": response.id, "pageParent": parentId };
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
        console.log(pages.printTree())
        return pages.printTree()
    }
    else{ 
        const page = pages.getNodeByName(rootPageName)
        return pages.printTree(page)
    }
}

export default { createPage, getPagesTree, addToFirebase}