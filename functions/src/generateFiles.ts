import functions from 'firebase-functions'
import admin from 'firebase-admin'

import os from 'os'
import path from 'path'
import fs from 'fs'
import JSZip from 'jszip'

const app = admin.initializeApp()

// Separate function from the other because scale
export const generateFiles = functions.runWith({ timeoutSeconds: 20 }).https.onCall(async (props: { json: any, name: string }) => {
    const json = props.json

    const filesDir = path.join(os.tmpdir(), 'notion-ai-os', 'files');
    const zipDir = path.join(os.tmpdir(), 'notion-ai-os', 'zip');

    await fs.promises.mkdir(filesDir, { recursive: true });
    await fs.promises.mkdir(zipDir, { recursive: true });

    await createDownloadable(json, filesDir);

    const zippedName = props.name + '.zip'
    const zip = new JSZip();
    const zipPath = path.join(zipDir, zippedName);

    await addDirToZip(filesDir, zip);
    const content = await zip.generateAsync({ type: "nodebuffer" });

    fs.writeFileSync(zipPath, content);

    const bucket = admin.storage().bucket();
    const [file] = await bucket.upload(zipPath, {
        destination: `user_file/` + zippedName,
    });

    const url = file.metadata.mediaLink;

    return { url };
});

async function addDirToZip(dir: any, zip: any) {
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
    if (node !== undefined) {
        if (node.name === undefined) {
            if (checkIsArray(node)) {
                createFilesAndFolders(node[0], currentPath)
            }
        }
        else {
            const newPath = path.join(currentPath, node.name);
            console.log("found: " + node.name)
            if (node.type === 'folder') {
                if (!fs.existsSync(newPath)) {
                    await fs.promises.mkdir(newPath);
                    console.log("added dir at: " + newPath)
                }

                if (node.children) {
                    for (const child of node.children) {
                        createFilesAndFolders(child, newPath);
                    }
                }
            } else if (node.type !== 'folder') {
                const data = node.content ?? 'This file is empty'

                console.log("data", data)
                fs.writeFileSync(newPath, data)
                console.log("added file at: " + newPath)
            }
        }
    }
};

async function createDownloadable(jsonTree: any, currentPath: string) {
    await createFilesAndFolders(jsonTree, currentPath)
}
