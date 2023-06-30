import { Client } from "@notionhq/client";
import * as pages from "../projecthandler/PageTree.js";
import { Page } from "../projecthandler/PageTree.js";
import { doc, setDoc, getDoc, Firestore } from "firebase/firestore";
import { getIcon } from "./iconManager/iconManager.js";
import { generateFiles } from "../generateFiles.js";
import { FirebaseStorage } from "firebase/storage";
const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"

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

async function updateProjectPageContent(db: Firestore, userId: string, projectName: string, pageId: string, content: string) {
    let project = await getProject(db, userId, projectName)

    if (!project) {
        console.log("There was no root", projectName)
        return undefined;
    }

    console.log(pageId)
    project = pages.addContentToPage(project, pageId, content)

    try {
        await setDoc(doc(db, 'users', userId, "projects", projectName), {
            project
        });

        return ("Updated page: " + pageId + " in " + projectName + ".")

    } catch (e: any) {
        return ("Unknown error updating project: " + e)
    }
}

async function getProject(db: Firestore, userId: string, projectName: string): Promise<any> {
    const docRef = doc(db, 'users', userId, "projects", projectName)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
        return undefined
    }

    return docSnap.data().project;
}

async function getPage(db: Firestore, userId: string, projectName: string, pageName: string) {
    const project = await getProject(db, userId, projectName)

    if (project) {
        return pages.getNodeByName(project, pageName)
    }
}

async function createProject(storage: FirebaseStorage, db: Firestore, notion: Client, userId: string, projectName: string) {
    if (await getProject(db, userId, projectName)) return "User already has a project with the name: '" + projectName + "'"

    const res = await addPageToNotion(notion, { name: projectName, type: "folder" }, DATABASEID, "root", userId)

    const projectRef = doc(db, 'users', userId, "projects", projectName)
    await setDoc(projectRef, {
        project:
            [{
                name: projectName,
                id: res.id,
                creatorId: userId,
                type: "project",
                tags: "",
                children: []
            }]
    })

    return "Project : '" + projectName + "' successfully created"
}

async function addTagsToProject(db: Firestore, notion: Client, userId: string, projectName: string, tags: any[]) {
    const project = await getProject(db, userId, projectName)

    if (!project) return "Could not find project: " + projectName
    let filteredTags: any[] = []

    try {
        tags.forEach((tag) => {
            try {
                if (tag.length > 10) return "tag " + tag + " is too long. Please keep less than 15 chars";
                else {
                    filteredTags.push({"name" : tag})
                }
            } catch (error) {
                console.log("There was an error attempting to add a tag" + error)
            }
        })
    } catch (error) {
        return "'tags' was not an array" + error
    }

    const oldTags = project[0].tags
    console.log(oldTags)
    filteredTags = filteredTags.concat(oldTags)


    type SelectColor = "default" | "gray" | "brown" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "red";

    const multi_select: ({
        id: string;
        name?: string;
        color?: SelectColor;
    } | {
        name: string;
        id?: string;
        color?: SelectColor;
    })[] = filteredTags


    if(multi_select){ 
        await notion.pages.update({
            page_id: project[0].id,
            properties: {
                Tags: {
                    multi_select: multi_select
                }
            },
        });

        project[0].tags = multi_select
        await setDoc(doc(db, 'users', userId, "projects", projectName), {
            project
        });
    }
}

async function updateDownloadLink(storage: any, db: Firestore, notion: Client, userId: string, projectName: string){ 
    const project = await getProjectJson(db, userId, projectName)

    console.log("project", project)

    if (!project) return "Could not find project: " + projectName

    let url: string = await generateFiles(storage, { json: project[0], name: projectName })

    if(url){
        project.downloadLink = url;
        await notion.pages.update({
            page_id: project[0].id,
            properties: {
                download: {
                    rich_text: [
                        {   
                            // fancy emoji here - watch out it's invisible
                            text: {
                                content: "❇️ ( click me )", 
                                link: { url : url}
                            },
                            annotations: {
                                underline: true
                            }
                        }
                    ]
                }
            },
        }); 
    
        await setDoc(doc(db, 'users', userId, "projects", projectName), {
            project
        });
    }
}

async function addPageToNotion(notion: Client, page: { name: string, type: string }, parentId: string, parentType: string, creatorId: string) {
    const icon = await getIcon(page.type)

    let response;
    if (parentType !== "root") {
        try {

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
                }, 
                "creator":{ 
                    "rich_text": [
                        {   
                            "text": {
                                "content": creatorId
                            },
                            "annotations": {
                                "italic": true
                            }
                        }
                    ]
                }, 
                download: {
                    rich_text: [
                        {   
                            text: {
                                content: "nothing here yet!"
                            },
                            annotations: {
                                underline: true
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

async function createPage(storage: FirebaseStorage, db: Firestore, notion: Client, userId: string, projectName: string, parentName: string, pageName: string, pageType: string) {
    const projectFiles: Page[] = await getProjectJson(db, userId, projectName)
    const parentType = pages.getNodeByName(projectFiles, parentName)?.type

    if (!parentType) return "Could not create page because parent: '" + parentName + "' does not exist"
    if (parentType !== "root" && parentType !== "folder" && parentType !== "project") return "Could not create page because parent: '" + parentName + "' is a file"

    if (pageType.toLowerCase() === "project") return "Please make a new project with the createProject request"
    if (!projectFiles) return ("No project with name: '" + projectName + "' found.")
    if (pages.getNodeByName(projectFiles, pageName)) return { Error: "Page name already exists, no duplicates please" }

    const parentId = pages.getNodeByName(projectFiles, parentName)?.id

    const response = await addPageToNotion(notion, { name: pageName, type: pageType }, parentId, parentType, userId)

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

    try { 
        await updateDownloadLink(storage, db, notion, userId, projectName)
    } catch (error) { 
        console.log("could not update download link : " + error)
    }
   
    return { "pageName": pageName, "pageParent": parentName };
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

export default { addTagsToProject, getPage, getProjectJson, getPagesTree, createPage, createProject, updateProjectPageContent }