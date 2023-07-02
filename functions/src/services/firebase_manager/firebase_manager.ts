import { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "../../initialize.js";
import * as project_functions from "../../projecthandler/project_functions.js"

async function getProject(userId: string, projectName: string) {
    const db: Firestore = getDb()
    console.log("got db")
    try {
        const projectRef = doc(db, 'users', userId, "projects", projectName)
        const projectDocSnap = await getDoc(projectRef)

        if (projectDocSnap.exists()) {
            let data = projectDocSnap.data()

            console.log(data)
            return data.project;
        }

        else {
            console.log("project: " + projectName + " doesn't exist")
            return undefined;
        }

    } catch (e: any) {
        console.log("could not get doc")
        throw new Error("Could not get doc")
    }
}   

async function getPage(userId: string, projectName: string, pageName: string) {
    const project = await getProject(userId, projectName)

    console.log(project)
    if (project) {
        return project_functions.getNodeByName(project, pageName)
    }
}

async function updateProjectPageContent(userId: string, projectName: string, pageId: string, content: string) {
    const db: Firestore = getDb()
    let project = await getProject(userId, projectName)

    if (!project) return new Error ("There was no root" + projectName);
    

    project = project_functions.addContentToPage(project, pageId, content)

    try {
        await setDoc(doc(db, 'users', userId, "projects", projectName), {
            project
        });

        return ("Updated page: " + pageId + " in " + projectName + ".")

    } catch (e: any) {
        return new Error ("Unknown error updating project: " + e)
    }
}

async function setUserProject(userId: string, projectName: string, project: any, merge: boolean = false) { 
    const db = getDb()
    await setDoc(doc(db, 'users', userId, "projects", projectName), {
        project
    }, { merge: merge });
}

export default { getProject, getPage, updateProjectPageContent, setUserProject }