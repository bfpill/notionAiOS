import { Client } from "@notionhq/client";
import * as pages from "../projecthandler/PageTree.js";
import { Page } from "../projecthandler/PageTree.js"; 
import { doc, setDoc, getDoc, collection, addDoc, Firestore} from "firebase/firestore";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function getProjectJson(db: Firestore, projectId: string) {
    const projectDocRef = doc(db, 'projects', projectId)
    const projectDocSnap = await getDoc(projectDocRef)

    if (!projectDocSnap.exists()) {
        return undefined;
    }

    let data = projectDocSnap.data()

    if (!data.project) {
        console.log("There was no root", data)
        data = {
            project: [{
                "name": "root",
                "id": "root-node",
                "type": "folder",
                "children": []
            }]
        };
        await setDoc(projectDocRef, data, { merge: true });
    }

    return data.project;
}

async function updateProject(db: Firestore, projectId: string, pageName: string, content: string ) { 
    const projectDocRef = doc(db, 'projects', projectId)
    const projectDocSnap = await getDoc(projectDocRef)

    if (!projectDocSnap.exists()) {
        return undefined;
    }

    let data = projectDocSnap.data()
    let project = data.project;

    if (!project) {
        console.log("There was no root", projectId)
        return undefined;
    }

    const page = pages.getNodeByName(project, pageName)

    if (page) {
        project = pages.addContentToPage(project, page.id, content)
    } else {
        return { Error: "Page not found in project" };
    }

    // Update the document with the updated JSON
    await setDoc(projectDocRef, { project }, { merge: false })

    return project;
}

async function createProject(db: Firestore, projectName: string) {
    const docRef = await addDoc(collection(db, "projects"), {
        projectName: projectName,
    });

    return docRef.id
}

async function getPage(db: Firestore, projectId: string, pageName: string): Promise<Page> { 
    const projectDocRef = doc(db, 'projects', projectId)
    const projectDocSnap = await getDoc(projectDocRef)

    if (!projectDocSnap.exists()) {
        return undefined;
    }

    const project: Page[] = projectDocSnap.data().project

    return pages.getNodeByName(project, pageName)
}

async function createPage(db: Firestore, notion: Client, projectId: string, parentName: string, pageName: string, type: string) {
    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl

    let response;

    const projectFiles: Page[] = await getProjectJson(db, projectId)

    if (!projectFiles) {
        return ("No project with id: " + projectId + " found.")
    }
    if (pages.getNodeByName(projectFiles, pageName)) {
        return { Error: "Page name already exists, no duplicates please" };
    }

    let parentId = pages.getNodeByName(projectFiles, parentName)?.id

    if (parentId !== 'root-node') {
        try {
            const parentType = pages.getNodeByName(projectFiles, parentName)?.type

            if (!parentType || parentType !== "folder") {
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

    const project = pages.addPage(projectFiles, { name: pageName, id: response.id, type: type, content: "" }, parentName)

    await setDoc(doc(db, "projects", projectId), {
        project
    });

    return { "pageId": response.id, "pageParent": response.parent };
}

function getPagesTree(pages: any, rootPageName: string) {
    if (rootPageName.toLowerCase() === 'root') {
        console.log(pages.printTree())
        return pages.printTree()
    }
    else {
        const page = pages.getNodeByName(rootPageName)
        return pages.printTree(page)
    }
}

export default { getPage, getProjectJson, getPagesTree, createPage, createProject, updateProject }