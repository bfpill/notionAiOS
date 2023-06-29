import { Client } from "@notionhq/client";
import * as pages from "../projecthandler/PageTree.js";
import { Page } from "../projecthandler/PageTree.js";
import { doc, setDoc, getDoc, collection, addDoc, Firestore } from "firebase/firestore";
import { projectID } from "firebase-functions/params";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function getProjectJson(db: Firestore, projectId: string, projectName: string) {
    const projectDocRef = doc(db, 'projects', projectId)
    const projectDocSnap = await getDoc(projectDocRef)

    console.log("smnap", projectDocSnap.data())

    if (!projectDocSnap.exists()) {
        console.log("project doesn't exist")
        return undefined;
    }

    let data = projectDocSnap.data()

    return data.project;
}

async function updateProject(db: Firestore, projectId: string, pageName: string, content: string) {
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

async function createProject(db: Firestore, notion: Client, projectName: string) {
    const docRef = await addDoc(collection(db, "projects"), {}).then((res) => {
        setDoc(doc(db, "projects", res.id), 
            { project: [{
                name: projectName,
                id: res.id,
                type: "root",
                children: []
            }] }
        );
        return res
    })

    console.log("Id " + docRef.id)

    const res = await addPageToNotion(notion, { name: projectName, type: "folder"}, docRef.id, "root")
    console.log(res)
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

async function addPageToNotion( notion: Client, page: { name: string, type: string }, parentId: string, parentType: string){ 
    page.type = page.type.toLowerCase();
    const icon = (page.type === "folder" || page.type === "root") ? folderIconURL : fileIconUrl

    let response;
    if (parentType !== "root") {
        try {

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
                                    "content": page.name
                                }
                            }
                        ]
                    }
                },
            })
        } catch (e: any) {
            if (e instanceof TypeError) {
                return e
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
                }
            },
            "children": []
        })
    }
    return response; 
}

async function createPage(db: Firestore, notion: Client, projectId: string, parentName: string, pageName: string, pageType: string, projectName?: string) {
   
    const projectFiles: Page[] = await getProjectJson(db, projectId, projectName)

    if (!projectFiles) {
        return ("No project with id: " + projectId + " found.")
    }
    if (pages.getNodeByName(projectFiles, pageName)) {
        return { Error: "Page name already exists, no duplicates please" };
    }

    console.log("files", projectFiles)

    const parentType = pages.getNodeByName(projectFiles, parentName)?.type
    const parentId = pages.getNodeByName(projectFiles, parentName)?.id

    const response = await addPageToNotion(notion, { name: pageName, type: pageType }, parentId, parentType)

    const page: Page = { 
        name: pageName, 
        id: response.id,
        type: pageType, 
        content: ""
    }

    const project = pages.addPage(projectFiles, page , parentName)

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