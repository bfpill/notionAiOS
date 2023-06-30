import { FirebaseStorage, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import os from 'os'
import path from 'path'
import fs from 'fs'
import JSZip from 'jszip'

export const generateFiles = async (storage: FirebaseStorage, props: { json: any, name: string }): Promise<string> => {
    try {
        const json = props.json
        const filesDir = path.join(os.tmpdir(), 'notion-ai-os', 'files');
        const zipDir = path.join(os.tmpdir(), 'notion-ai-os', 'zip');

        if(fs.existsSync(filesDir)){
            await fs.promises.rm(filesDir, { recursive: true, force: true})
        }
        if(fs.existsSync(zipDir)){
            await fs.promises.rm(zipDir, { recursive: true, force: true})
        }

        await fs.promises.mkdir(filesDir, { recursive: true });
        await fs.promises.mkdir(zipDir, { recursive: true });

        await createDownloadable(json, filesDir);

        const zippedName = props.name + '.zip'
        const zip = new JSZip();
        const zipPath = path.join(zipDir, zippedName);

        await addDirToZip(filesDir, zip);
        const content = await zip.generateAsync({ type: "nodebuffer" });

        fs.writeFileSync(zipPath, content);

        const storageRef = ref(storage, `user_file/${zippedName}`)

        const uploadTask = uploadBytesResumable(storageRef, content);

        const url: {url : string} = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                () => {
                    // resolves and the URL gets returned
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve({ url: downloadURL });
                    });
                }
            );
        });
        try{ 
            return url.url
        } catch (error){
            return error
        }
       
    } catch (error) {
        return 'An error occurred while generating files' + error;
    }
};

async function addDirToZip(dir: any, zip: any) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                const data = fs.readFileSync(fullPath);
                zip.file(file, data);
            } else if (stat.isDirectory()) {
                const subdir = zip.folder(file);
                await addDirToZip(fullPath, subdir);
            }
        }
    } catch (error) {
        return 'An error occurred while addDirZip' + error;
    }

}

interface PageNode {
    name: string;
    id: string;
    type: string;
    children?: PageNode[];
    content?: string;
}

function checkIsArray(variable: any) {
    if (variable instanceof Array) {
        return true
    }
    return false
}

const createFilesAndFolders = async (node: PageNode, currentPath: string) => {
    try {
        if (node !== undefined) {
            if (node.name === undefined) {
                if (checkIsArray(node)) {
                    await createFilesAndFolders(node[0], currentPath)
                }
            }
            else {
                const newPath = path.join(currentPath, node.name);
                if (node.type === 'folder' || node.type === 'root' || node.type === 'project') {
                    if (!fs.existsSync(newPath)) {
                        await fs.promises.mkdir(newPath);
                    }

                    if (node.children) {
                        for (const child of node.children) {
                            await createFilesAndFolders(child, newPath);
                        }
                    }
                } else if (node.type !== 'folder') {
                    const data = node.content ?? 'This file is empty'
                    fs.writeFileSync(newPath, data)
                }
            }
        }
    } catch (error) {
        console.error('Error occurred:' + error);
        return 'An error occurred while creatingFilesAndFolders';
    }
};

async function createDownloadable(jsonTree: any, currentPath: string) {
    await createFilesAndFolders(jsonTree, currentPath)
}
