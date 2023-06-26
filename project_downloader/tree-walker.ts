import fs from 'fs';
import path from 'path';
import { parseFromTree } from "../notion_manager/PageTree"

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

const data: Node[] = [/* your JSON data here */];

export default function createDownloadable (data: any) { 

    const jsonTree = parseFromTree()

    for (const page of jsonTree) {
        createFilesAndFolders(page);
    }
}
