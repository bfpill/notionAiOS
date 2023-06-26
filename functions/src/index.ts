const functions = require('firebase-functions');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const { Storage: GCloudStorage } = require('@google-cloud/storage');

admin.initializeApp();

exports.generateFiles = functions.runWith({ timeoutSeconds: 20 }).https.onCall(async (data: any) => {

    // Generate files from JSON data structure
    const json = data.json[0]

    const tmpdir = path.join(os.tmpdir(), 'notion-ai-os'); // Create a new directory within the system's temporary directory

    // Create the directory if it doesn't exist
    if (!fs.existsSync(tmpdir)) {
        fs.mkdirSync(tmpdir);
    }

    createDownloadable(json, tmpdir);

    const zip = new JSZip();
    const zipPath = path.join(tmpdir, 'files.zip');

    await addDirToZip(tmpdir, zip);

    const content = await zip.generateAsync({type:"nodebuffer"});

    fs.writeFileSync(zipPath, content);

    const bucket = admin.storage().bucket();
    const [file] = await bucket.upload(zipPath, {
        destination: `user_files/files.zip`,
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

const createFilesAndFolders = (node: PageNode, currentPath: string = '.') => {

    if (node !== undefined) {
        const newPath = path.join(currentPath, node.name);

        if (node.type === 'folder') {
            if (!fs.existsSync(newPath)) {
                fs.mkdirSync(newPath);
            }

            if (node.children) {
                for (const child of node.children) {
                    createFilesAndFolders(child, newPath);
                }
            }
        } else if (node.type === 'javascript') {
            fs.writeFileSync(newPath, node.content || '');
        }
    }
};

function createDownloadable(jsonTree: any, currentPath: string) {
    createFilesAndFolders(jsonTree, currentPath)
}

