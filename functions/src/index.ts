const functions = require('firebase-functions');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
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

    console.log("Downloadable created")

    const zipPath = path.join(tmpdir, 'files.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');
    archive.pipe(output);

    // Listen for the 'entry' event
    archive.on('entry', (entry: any) => {
        console.log(`Appended file: ${entry.name}`);
    });

    // Listen for the 'error' event
    archive.on('error', (err: any) => {
        console.error(`Archiver error: ${err}`);
    });

    archive.directory(tmpdir, false);

    // Wait for the 'end' event before calling archive.finalize()
    archive.on('end', async () => {
        console.log('Archiver finished appending files');
        await archive.finalize();
        console.log('Archiver finalized');
    })

    console.log("archiver finalized")
    const bucket = admin.storage().bucket();
    await bucket.upload(zipPath, {
        destination: `user_files/files.zip`,
    });


    console.log("Bucket created")
    // Generate download URL
    const file = bucket.file(`user_files/files.zip`);
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60, // 1 hour expiration
    });

    console.log("Url made: " + url)

    return { url };
});

interface PageNode {
    name: string;
    id: string;
    type: string;
    children?: PageNode[];
    content?: string;
}

const createFilesAndFolders = (node: PageNode, currentPath: string = '.') => {

    if (node !== undefined) {
        console.log("Node Name: " + node.name)
        console.log("Current Path: " + currentPath)
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
    console.log("TREE: ")
    console.log(jsonTree)
    createFilesAndFolders(jsonTree, currentPath)
}
