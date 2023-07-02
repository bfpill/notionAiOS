import services from "../services/services.js";
import { CreatePageRequest, Page } from "../projecthandler/interfaces.js";
import { generateFiles } from "../generateFiles.js";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import dotenv from "dotenv"

import firebase_manager from "../services/firebase_manager/firebase_manager.js"
import notion_manager from "../services/notion_manager/notion_manager.js"

dotenv.config()

const functions = getFunctions()

// Point to the Functions emulator
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

const getDownloadLink = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName
    ) {
        return fourHunnid(res)
    }

    const projectName = body.projectName;
    const project = await firebase_manager.getProject(body.userId, projectName)

    const url = await generateFiles({ json: project, name: projectName })

    if(url instanceof Error){ 
        res.status(201).send({err: url.message});
    }  
    else res.status(201).send({ url : url });
};

const createProject = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName
    ) {
        return fourHunnid(res)
    }
    const { userId, projectName } = body;
    const messageResponse = await services.createProject(userId, projectName);

    res.status(201).send({ ok: messageResponse });
}

const addProjectTags = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName ||
        !body.tags
    ) {
        return fourHunnid(res)
    }
    const userId = body.userId
    const projectName = body.projectName
    const tags = body.tags

    const messageResponse = await services.addTagsToProject(userId, projectName, tags);

    if(!(messageResponse instanceof Error)){
        res.status(201).send({ ok: "Successfully added tags" });
    }
    else { 
        res.status(401).send({err: messageResponse.message });
    }
}

const createPage = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName ||
        !body.parentName ||
        !body.pageName ||
        !body.type

    ) {
        return fourHunnid(res)
    }
    const userId = body.userId
    const projectName = body.projectName
    const parentName = body.parentName === 'root' ? projectName : body.parentName
    const pageName = body.pageName
    const type = body.type
    const code = body.code

    const page: CreatePageRequest = { 
        name: pageName, 
        content: code, 
        type: type, 
    }

    console.log(body.code)
    const messageResponse = await services.createPage(userId, projectName, parentName, page);
    
    if(messageResponse instanceof Error){
        res.status(500).send(messageResponse.message);
    }
    else {
        res.status(201).send({ ok: "Successfully created page" });
    }
}

const pageActions = async (req, res) => {
    const { body } = req
    if (
        !body.userId ||
        !body.projectName ||
        !body.command ||
        !body.pageName ||
        !body.code
    ) {
        return fourHunnid(res);
    }

    const { userId, projectName, command, pageName, code } = body

    const page: Page = await firebase_manager.getPage(userId, projectName, pageName)

    if(!page){ 
        res.status(401).send({ err: "Could not find page '" + pageName + "'" });
    }
    else if ((page.type !== "folder" && page.type !== 'root' && page.type !== "project")) {

        let updatedContent: string;
        if (command === "REPLACE CODE") {
            const { startLine, endLine } = body
            updatedContent = services.replaceLines(page, code, startLine, endLine)
        }
        else if (command === "ADD CODE") {
            // add to what the page already has 
            updatedContent = code + "\n" + page.content
        }
        else {
            res.status(401).send({ err: "Could not parse command '" + body.command + "'" });
            return;
        }

        const updatedInNotion = await notion_manager.updateCodeInNotion(page, updatedContent)

        if(!(updatedInNotion instanceof Error)){ 
            const updatedInFirebase = await firebase_manager.updateProjectPageContent(body.userId, body.projectName, page.id, updatedContent)
            if(!(updatedInFirebase instanceof Error)){ 
                res.status(201).send({ ok: "Successfully updated page :'" + pageName + "'." });
            } else { 
                res.status(500).send({ err: "Could not update in Firebase: " + updatedInFirebase.message });
            }
        } else { 
            res.status(401).send({ err: "Could not update in notion: " + updatedInNotion.message });
        }
    }   
}

const fourHunnid = (res: any) => {
    res
        .status(400)
        .send({
            status: "FAILED",
            data: {
                error:
                    "Error becuase you prolly forgot a property"
            },
        });
}

export default {
    //page functions
    createPage,
    addProjectTags,
    pageActions,
    createProject,
    getDownloadLink
};
