import { generateFiles } from "../generateFiles.js";
import * as project_functions from "../projecthandler/project_functions.js";
import { Page, CreatePageRequest } from "../projecthandler/interfaces.js";
import { toArray, deleteLines, insertCodeByLine } from "./codeBlockFunctions.js";
import firebase_manager from "./firebase_manager/firebase_manager.js";
import notion_manager, { addPageToNotion } from "./notion_manager/notion_manager.js";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"

function replaceLines(page: Page, newCode: string, startLine: number, endLine: number) {
    try {
        const oldCode = toArray(page.content, "\n")
        let deletedLines = deleteLines(oldCode, startLine, endLine)
        if (deletedLines) {
            const newCodeArray = insertCodeByLine(deletedLines, newCode, startLine) as string[]
            newCode = newCodeArray.join("\n")
            return newCode;
        }
        return undefined
    } catch (error: any) {
        console.log(error)
        return undefined;
    }
}

async function createProject(userId: string, projectName: string) {
    if (await firebase_manager.getProject(userId, projectName)) return "User already has a project with the name: '" + projectName + "'"

    const pageRequest: CreatePageRequest = { name: projectName, type: "folder" }
    const res = await addPageToNotion(pageRequest, DATABASEID, "root", userId)

    try{ 
        await firebase_manager.setUserProject(userId, projectName,
            [{
                name: projectName,
                id: res.id,
                creatorId: userId,
                type: "project",
                tags: [],
                children: []
            }]
        )
    } catch (error){ 
        return new Error("Could not update the users project. ")
    }

    return "Project : '" + projectName + "' successfully created"
}

async function updateDownloadLink(userId: string, projectName: string) {
    const project = await firebase_manager.getProject(userId, projectName)

    console.log("project", project)

    if (!project) return "Could not find project: " + projectName

    let url: string | Error = await generateFiles({ json: project[0], name: projectName })
    if (url instanceof Error) return url;

    notion_manager.updateProjectDownloadLink(url, project.id)

    project.downloadLink = url;
    firebase_manager.setUserProject(userId, projectName, project)
}

async function addTagsToProject(userId: string, projectName: string, tags: any[]) {

    const project = await firebase_manager.getProject(userId, projectName)

    if (!project) return "Could not find project: " + projectName

    let filteredTags: any[] = []
    const oldTags: any[] = project[0].tags

    try {
        for(let tag of tags) {
            if (!(tag && tag !== "")) continue;
            if(oldTags.map(tag => tag.name).includes(tag)) continue;
            if (tag.length > 20) {
                return new Error ("Tag was too long");
            }
            else {
                filteredTags.push({ "name": tag })
            }
        }
    } catch (error) {
        return new Error("'tags' was not an array" + error)
    }


    if (oldTags.join().length > 130) return new Error("The project's tags are too long!! Please delete existing tags or use shorter tags :)")

    if (oldTags.length > 0) filteredTags = filteredTags.concat(oldTags)

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

    console.log(filteredTags)

    if (multi_select) {
        notion_manager.updateProjectTags(multi_select, project[0].id)
        project[0].tags = [].concat(multi_select)
        console.log(project[0].tags)
        await firebase_manager.setUserProject(userId, projectName, project, true)
    }
}

async function createPage(userId: string, projectName: string, parentName: string, page: CreatePageRequest) {

    const projectFiles: Page[] = await firebase_manager.getProject(userId, projectName)
    const parentType = project_functions.getNodeByName(projectFiles, parentName)?.type

    if (!parentType) return new Error ("Could not create page because parent: '" + parentName + "' does not exist")
    if (parentType !== "root" && parentType !== "folder" && parentType !== "project") return new Error ("Could not create page because parent: '" + parentName + "' is a file")

    if (page.type.toLowerCase() === "project") return new Error ("Please make a new project with the createProject request")
    if (!projectFiles) return new Error ("No project with name: '" + projectName + "' found.")
    if (project_functions.getNodeByName(projectFiles, page.name)) return new Error("Page name already exists, no duplicates please")

    const parentId = project_functions.getNodeByName(projectFiles, parentName)?.id

    console.log("code: ", page.content)
    const response = await addPageToNotion(page, parentId, parentType, userId)
    
    if (!response) return new Error ("Could not add page to notion. Check with the user that the parent page still exists!")
    const newPage: Page = {
        name: page.name,
        id: response.id,
        type: page.type,
        codeId: response.codeId,
        content: page.content
    }

    const project = project_functions.addPage(projectFiles, newPage, parentName)

    await firebase_manager.setUserProject(userId, projectName, project)

    try {
        await updateDownloadLink(userId, projectName)
    } catch (error) {
        console.log("could not update download link : " + error)
    }

    return { "pageName": newPage.name, "pageParent": parentName };
}

export default { createPage, updateDownloadLink, createProject, replaceLines, addTagsToProject }