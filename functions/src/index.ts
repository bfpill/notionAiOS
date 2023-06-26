const functions = require('firebase-functions');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const { Storage: GCloudStorage } = require('@google-cloud/storage');

admin.initializeApp();

exports.generateFiles = functions.runWith({ timeoutSeconds: 20 }).https.onCall(async (props: {json: any, name: string}) => {

    // Generate files from JSON data structure
    const json = props.json[0]

    const tmpdir = path.join(os.tmpdir(), 'notion-ai-os'); // Create a new directory within the system's temporary directory

    if (fs.existsSync(tmpdir)) {
        fs.rmdirSync(tmpdir, {
            recursive: true,
        })
    }
    
    fs.mkdirSync(tmpdir);

    createDownloadable(json, tmpdir);

    const zippedName = props.name + '.zip'
    const zip = new JSZip();
    const zipPath = path.join(tmpdir, zippedName );

    await addDirToZip(tmpdir, zip);

    const content = await zip.generateAsync({type:"nodebuffer"});

    fs.writeFileSync(zipPath, content);

    const bucket = admin.storage().bucket();
    const [file] = await bucket.upload(zipPath, {
        destination: `user_files/` + zippedName,
    });

    const url = file.metadata.mediaLink;
    
    return { url }; 
});

async function cleanUpTempDir(tmpdir: string){
    try{ 
        fs.rmdirSync(tmpdir, {
            recursive: true,
        })
    } catch (e: any){
        console.log("fuck shit fuck bad error: " + e)
    }
}

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

