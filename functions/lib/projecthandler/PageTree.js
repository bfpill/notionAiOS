import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
let fullPath;
function parseFromTree(filename = 'pageTree.json') {
    const currentModuleUrl = import.meta.url;
    const currentModulePath = fileURLToPath(currentModuleUrl);
    const parentDirPath = path.dirname(path.dirname(currentModulePath));
    console.log("parent : " + parentDirPath);
    const dataFolderPath = path.join(parentDirPath, 'data');
    fullPath = path.join(dataFolderPath, filename);
    const jsonData = fs.readFileSync(fullPath, 'utf8');
    try {
        return JSON.parse(jsonData);
    }
    catch (e) {
        return JSON.parse("[]");
    }
}
const jsonTree = parseFromTree();
class PageTree {
    tree;
    archive;
    constructor() {
        console.log('Initialized and ready to roll');
        this.tree = jsonTree || []; // Initialize with existing JSON data or an empty array
        // Check if the tree is empty and add a root node if necessary
        if (this.tree.length === 0) {
            const root = {
                name: 'root',
                id: 'root-node',
                type: 'folder'
            };
            this.tree.push(root);
            this.updateJSON();
        }
        this.archive = [];
    }
    add(page, parentName) {
        page.type = page.type ? page.type : 'Unknown';
        console.log("parent: " + parentName);
        if (parentName) {
            console.log("Found parent node");
            const parentNode = this.findNodeByName(this.tree, parentName);
            if (parentNode) {
                parentNode.children = parentNode.children || [];
                parentNode.children.push(page);
            }
            console.log('Added page:', page);
        }
        else {
            const rootNode = this.findNodeByName(this.tree, "root");
            rootNode.children = rootNode.children || [];
            rootNode.children.push(page);
        }
        this.updateJSON();
    }
    delete(page) {
        page.type = page.type ? page.type : 'Unknown';
        console.log('Deleted page:', page);
        const parentNode = this.findParentNode(this.tree, page);
        if (parentNode?.children) {
            parentNode.children = parentNode.children.filter((child) => child.name !== page.name);
        }
        else {
            this.tree = this.tree.filter((node) => node.name !== page.name);
        }
        this.archive.push(page);
        this.updateJSON();
    }
    getNodeByName(name) {
        return this.findNodeByName(this.tree, name);
    }
    getNodeById(id, nodes = this.tree) {
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
    findNodeByName(nodes, name) {
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
        console.log("No nodes!!");
        return undefined;
    }
    findParentNode(nodes, targetNode) {
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
    updatePage(page, content) {
        page.content = content;
        this.updateJSON();
    }
    printTree(nodes = this.tree, level = 0) {
        let tree = "";
        if (nodes instanceof Array) {
            const sortedNodes = [...nodes].sort((a, b) => a.name.localeCompare(b.name));
            for (const node of sortedNodes) {
                const indentation = this.leftpad(level);
                tree += (`${indentation}${node.name}`) + "\n";
                if (node.children) {
                    tree += this.printTree(node.children, level + 1);
                }
            }
        }
        else {
            //we hit this else when we are passing in a page as the root node
            if (nodes.children) {
                const indentation = this.leftpad(level);
                tree += (`${indentation}${nodes.name}`) + "\n";
                tree += this.printTree(nodes.children, level + 1);
            }
        }
        return tree;
    }
    leftpad(indents) {
        let padding = "";
        for (let i = 0; i < indents; i++)
            [
                padding += "    "
            ];
        return padding;
    }
    getExtension(page) {
        const type = page.type;
        if (type === 'folder') {
            return ".dir";
        }
        else if (type === "rust") {
            return ".rs";
        }
        else
            return type ? "." + type : "";
    }
}
export { parseFromTree, PageTree };
//# sourceMappingURL=PageTree.js.map