import { Client } from "@notionhq/client";
import * as pages from "../projecthandler/PageTree.js";
import { doc, setDoc, getDoc, query, where, collection, getDocs } from "firebase/firestore";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function createPage(notion: Client, parentId: string, pageName: string, type: string) {

    //@todo remove
    let pages;
    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl

    let response;

    if (pages.getNodeByName(pageName)) {
        return { Error: "Page name already exists, no duplicates please" };
    }

    if (pages.getNodeByName(parentId)) {
        parentId = (pages.getNodeByName(parentId)).id
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

async function getProjectJson(db: any, projectId: string) { 

    // Check if a project with the same name already exists
    const q = query(collection(db, 'pages'), where('name', '==', projectId));
    const pageSnapshot = await getDocs(q);
    if (!pageSnapshot.empty) {
        return { Error: "Project name already exists, no duplicates please" };
    }

    const projectDocRef = doc(db, 'pages', projectId)
    const projectDocSnap = await getDoc(projectDocRef)

    if (!projectDocSnap.exists()) {
        return { Error: "Project does not exist" };
    }

    let data = projectDocSnap.data();

    if(!data.project){
        console.log("There was no root", data)
        data = { project: [ {
            "name": "root",
            "id": "root-node",
            "type": "folder",
            "children": []
        }] }; 
        await setDoc(projectDocRef, data, { merge: true });
    }

    return data.project; 
}

async function testDB(db: any, notion: Client, projectId: string, parentName: string, pageName: string, type: string) { 
    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl

    let response;

    const projectFiles = await getProjectJson(db, projectId)

    console.log("projectJson", projectFiles)

    if (pages.getNodeByName(projectFiles, pageName)) {
        return { Error: "Page name already exists, no duplicates please" };
    }

    let parentId;

    if (pages.getNodeByName(projectFiles, parentName)) {
        parentId = (pages.getNodeByName(projectFiles, parentName)).id
    }
    else { 
        parentId = "bonk"
    }

    console.log(parentId)

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
            const parentType = pages.getNodeByName(projectFiles, parentName)?.type

            console.log("parentType: " + parentType)
            if (parentType !== "folder") {

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

    console.log("preantName: " + parentName)
    const project = pages.addPage(projectFiles, { name: pageName, id: response.id, type: type }, parentName)

    await setDoc(doc(db, "pages", "testProject"), {
        project
    });

    return { "pageId": response.id, "pageParent": response.parent };
}   

function IDisRoot(id: string): boolean {
    if (id.toLowerCase() === "root-node") {
        console.log("id" + id)
        return true;
    }
    return false;
}

function getPagesTree (pages: any, rootPageName: string) { 
    if(rootPageName.toLowerCase() === 'root'){
        console.log(pages.printTree())
        return pages.printTree()
    }
    else{ 
        const page = pages.getNodeByName(rootPageName)
        return pages.printTree(page)
    }
}

export default { createPage, getPagesTree, testDB}