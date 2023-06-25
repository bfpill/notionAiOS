import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const filename = 'pageTree.json';

const currentModuleUrl = import.meta.url;
const currentModulePath = fileURLToPath(currentModuleUrl);
const parentDirPath = path.dirname(path.dirname(currentModulePath));
const dataFolderPath = path.join(parentDirPath, 'data');
const fullPath = path.join(dataFolderPath, filename);
const jsonData = fs.readFileSync(fullPath, 'utf8');

let jsonTree;

try{    
    jsonTree = JSON.parse(jsonData);
}
catch(e: any){
    jsonTree = JSON.parse("[]")
}

interface Page {
    name: string;
    id: string;
    type?: string;
    children?: Page[];
}

class PageTree {
    tree: Page[];
    archive: Page[];

    constructor() {
        console.log('Initialized and ready to roll');
        this.tree = jsonTree || []; // Initialize with existing JSON data or an empty array

        // Check if the tree is empty and add a root node if necessary
        if (this.tree.length === 0) {
            const root: Page = {
                name: 'root',
                id: 'root-node'
            };
            this.tree.push(root);
            this.updateJSON();
        }

        this.archive = [];
    }

    add(page: Page, parentName?: string) {
        page.type = page.type ? page.type : 'Unknown';

        console.log("parent: " + parentName)
        if (parentName) {
            console.log("Found parent node")
            const parentNode = this.findNodeByName(this.tree, parentName);
            if (parentNode !== "Name does not exist.") {
                parentNode.children = parentNode.children || [];
                parentNode.children.push(page);
            }
            console.log('Added page:', page);
        } else {
            const rootNode = this.findNodeByName(this.tree, "root") as Page;
            rootNode.children = rootNode.children || [];
            rootNode.children.push(page);
        }
        this.updateJSON();
    }

    delete(page: Page) {
        page.type = page.type ? page.type : 'Unknown';
        console.log('Deleted page:', page);
        const parentNode = this.findParentNode(this.tree, page);
        if (parentNode?.children) {
            parentNode.children = parentNode.children.filter(
                (child) => child.name !== page.name
            );
        } else {
            this.tree = this.tree.filter((node) => node.name !== page.name);
        }
        this.archive.push(page);
        this.updateJSON();
    }

    getNodeByName(name: string): Page | "Name does not exist." {
        return this.findNodeByName(this.tree, name);
    }

    getNodeById(id: string, nodes: Page[] = this.tree): Page | undefined {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }
            if (node.children) {
                const foundNode = this.getNodeById(id, node.children);
                if (foundNode) {
                    return foundNode;
                }
            }
        }
        return undefined;
    }

    findNodeByName(nodes: Page[], name: string): Page | "Name does not exist." {
        if (nodes.length > 0) {
            for (const node of nodes) {
                if (node.name === name) {
                    return node;
                }
                if (node.children) {
                    const foundNode = this.findNodeByName(node.children, name);
                    if (foundNode) {
                        return foundNode;
                    }
                }
            }
        }
        console.log("No nodes!!")
        return "Name does not exist."
    }

    findParentNode(nodes: Page[], targetNode: Page): Page | undefined {
        for (const node of nodes) {
            if (node.children) {
                if (node.children.includes(targetNode)) {
                    return node;
                }
                const parentNode = this.findParentNode(node.children, targetNode);
                if (parentNode) {
                    return parentNode;
                }
            }
        }
        return undefined;
    }

    updateJSON() {
        const updatedJSONData = JSON.stringify(this.tree);
        fs.writeFileSync(fullPath, updatedJSONData, 'utf8');
    }

    printTree(nodes: any = this.tree, level = 0) {
        if (nodes instanceof Array) {
            const sortedNodes = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

            for (const node of sortedNodes) {
                const indentation = this.leftpad(level);
                console.log(`${indentation}${node.name}${this.getExtension(node)}`);
                if (node.children) {
                    this.printTree(node.children, level + 1);
                }
            }
        }
        else {
            if (nodes.children) {
                this.printTree(nodes.children, level + 1);
            }
        }

    }

    leftpad(indents: number) {
        let padding: string = ""
        for (let i = 0; i < indents; i++) [
            padding += "    "
        ]
        return padding
    }

    getExtension(page: Page): string {
        const type = page.type
        if (type === 'folder') {
            return ".dir";
        }
        else if (type === "rust") {
            return ".rs";
        }

        else return type ? "." + type : "";
    }
}

export default PageTree;
