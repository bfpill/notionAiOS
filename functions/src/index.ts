const functions = require('firebase-functions');
const admin = require('firebase-admin');
const os = require('os');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

admin.initializeApp();

exports.generateFiles = functions.https.onCall(async (data: any, context: any) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'You must be signed in to generate files.'
    );
  }

  // Generate files from JSON data structure
  const json = data.json; // This is your JSON data structure
  
  createDownloadable(json)
  const tmpdir = os.tmpdir(); // Temporary directory to store files
  // TODO: Generate files from JSON and store in tmpdir

  // Zip the files
  const zipPath = path.join(tmpdir, 'files.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');
  archive.pipe(output);
  archive.directory(tmpdir, false);
  await archive.finalize();

  // Upload zip file to Firebase Cloud Storage
  const storage = new Storage();
  const bucket = storage.bucket(admin.storage().bucket().name);
  await bucket.upload(zipPath, {
    destination: `user_files/${context.auth.uid}/files.zip`,
  });

  // Generate download URL
  const file = bucket.file(`user_files/${context.auth.uid}/files.zip`);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60, // 1 hour expiration
  });

  return { url };
});

interface Node {
    name: string;
    id: string;
    type: string;
    children?: Node[];
    content?: string;
}

const createFilesAndFolders = (node: Node, currentPath: string = '.') => {
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
};

function createDownloadable (jsonTree: any) { 

    for (const page of jsonTree) {
        createFilesAndFolders(page);
    }

}
