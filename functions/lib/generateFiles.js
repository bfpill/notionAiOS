import functions from 'firebase-functions';
import admin from 'firebase-admin';
import os from 'os';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
admin.initializeApp();
export const generateFiles = functions.runWith({ timeoutSeconds: 20 }).https.onCall(async (props) => {
    // Generate files from JSON data structure
    const json = props.json;
    console.log("JSON: " + json);
    const tmpdir = path.join(os.tmpdir(), 'notion-ai-os'); // Create a new directory within the system's temporary directory
    if (fs.existsSync(tmpdir)) {
        fs.rmdirSync(tmpdir, {
            recursive: true,
        });
    }
    fs.mkdirSync(tmpdir);
    createDownloadable(json, tmpdir);
    const zippedName = props.name + '.zip';
    const zip = new JSZip();
    const zipPath = path.join(tmpdir, zippedName);
    await addDirToZip(tmpdir, zip);
    const content = await zip.generateAsync({ type: "nodebuffer" });
    fs.writeFileSync(zipPath, content);
    const bucket = admin.storage().bucket();
    const [file] = await bucket.upload(zipPath, {
        destination: `user_files/` + zippedName,
    });
    const url = file.metadata.mediaLink;
    return { url };
});
async function addDirToZip(dir, zip) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
            const data = fs.readFileSync(fullPath);
            zip.file(file, data);
        }
        else if (stat.isDirectory()) {
            const subdir = zip.folder(file);
            await addDirToZip(fullPath, subdir);
        }
    }
}
const createFilesAndFolders = (node, currentPath = '.') => {
    if (node !== undefined) {
        const newPath = path.join(currentPath, node.name);
        console.log("found: " + node.name);
        if (node.type === 'folder') {
            if (!fs.existsSync(newPath)) {
                fs.mkdirSync(newPath);
                console.log("added dir at: " + newPath);
            }
            if (node.children) {
                for (const child of node.children) {
                    createFilesAndFolders(child, newPath);
                }
            }
        }
        else if (node.type !== 'folder') {
            fs.writeFileSync(newPath, node.content || 'This file is empty');
            console.log("added file at: " + newPath);
        }
    }
};
function createDownloadable(jsonTree, currentPath) {
    console.log(jsonTree);
    createFilesAndFolders(jsonTree, currentPath);
}
//# sourceMappingURL=generateFiles.js.map