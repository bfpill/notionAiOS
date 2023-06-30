import { Client } from "@notionhq/client";
import * as pages from "../projecthandler/PageTree.js";
import { Page } from "../projecthandler/PageTree.js";
import { doc, setDoc, getDoc, Firestore } from "firebase/firestore";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function getProjectJson(db: Firestore, userId: string, projectName: string) {

    try {
        const projectRef = doc(db, 'users', userId, "projects", projectName)
        const projectDocSnap = await getDoc(projectRef)

        if (projectDocSnap.exists()) {
            let data = projectDocSnap.data()
            return data.project;
        }

        else {
            console.log("project: " + projectName + " doesn't exist")
            return undefined;
        }

    } catch (e: any) {
        throw new Error("Could not get doc")
    }
}

async function updateProject(db: Firestore, userId: string, projectName: string, pageId: string, content: string) {
    let project = await getProject(db, userId, projectName)

    if (!project) {
        console.log("There was no root", projectName)
        return undefined;
    }

    console.log(pageId)
    project = pages.addContentToPage(project, pageId, content)

    try{
        await setDoc(doc(db, 'users', userId, "projects", projectName), {
            project
        });

        return("Updated page: " + pageId + " in " + projectName + ".")

    } catch (e: any){
        return("Unknown error updating project: " + e) 
    }
}


async function getProject(db: Firestore, userId: string, projectName: string) : Promise<any>{
    const docRef = doc(db, 'users', userId, "projects", projectName)
    const docSnap = await getDoc(docRef)

    if(!docSnap.exists()){
        return undefined
    }

    return docSnap.data().project;
}

async function getPage(db: Firestore, userId: string, projectName: string, pageName: string){
    const project = await getProject(db, userId, projectName)

    if(project){
        console.log("hot the project", project)
        return pages.getNodeByName(project, pageName)
    }
}

async function createProject(db: Firestore, notion: Client, userId: string, projectName: string) {
    
    if(await getProject(db, userId, projectName)) return "User already has a project with the name: '" + projectName + "'"

    const res = await addPageToNotion(notion, { name: projectName, type: "folder" }, DATABASEID, "root")

    const projectRef = doc(db, 'users', userId, "projects", projectName)
    await setDoc(projectRef, {
        project:
            [{
                name: projectName,
                id: res.id,
                type: "folder",
                children: []
            }]
    })

    return "Project : '" + projectName + "' successfully created"
}

async function addPageToNotion(notion: Client, page: { name: string, type: string }, parentId: string, parentType: string) {
    page.type = page.type.toLowerCase();
    const icon = (page.type === "folder" || page.type === "root") ? folderIconURL : fileIconUrl

    let response;
    if (parentType !== "root") {
        try {

            if (!parentType || (parentType !== "folder" && parentType !== "root")) {
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
                }
            },
            "children": []
        })
    }
    return response;
}

async function createPage(db: Firestore, notion: Client, userId: string, projectName: string, parentName: string, pageName: string, pageType: string) {

    const projectFiles: Page[] = await getProjectJson(db, userId, projectName)

    const parentType = pages.getNodeByName(projectFiles, parentName)?.type

    if(!parentType) return "Could not create page because parent: '" + parentName + "' does not exist"
    if(parentType !== "root" && parentType !== "folder") return "Could not create page because parent: '" + parentName + "' is a file"

    if (!projectFiles) return ("No project with name: '" + projectName + "' found.")
    if (pages.getNodeByName(projectFiles, pageName)) return { Error: "Page name already exists, no duplicates please" }

    const parentId = pages.getNodeByName(projectFiles, parentName)?.id

    const response = await addPageToNotion(notion, { name: pageName, type: pageType }, parentId, parentType)

    const page: Page = {
        name: pageName,
        id: response.id,
        type: pageType,
        content: ""
    }

    const project = pages.addPage(projectFiles, page, parentName)

    await setDoc(doc(db, 'users', userId, "projects", projectName), {
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