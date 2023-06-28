interface Page {
    name: string;
    id: string;
    type?: string;
    children?: Page[];
    content?: any
}

function addPage (project: Page[], page: Page, parentName: string) {
    page.type = page.type ? page.type : 'Unknown';

    if (parentName && parentName !== 'root') {
        const parentNode = findNodeByName(project, parentName);
        if (parentNode) {
            parentNode.children = parentNode.children || [];
            parentNode.children.push(page);
            console.log('Added page:', page);
        }
    } else {
        const rootNode = findNodeByName(project, "root");
        rootNode.children = rootNode.children || [];
        rootNode.children.push(page);
    }

    return project
}

function deletePage (project: Page[], page: Page) {
    page.type = page.type ? page.type : 'Unknown';
    console.log('Deleted page:', page);
    const parentNode = findParentNode(project, page);
    if (parentNode?.children) {
        parentNode.children = parentNode.children.filter(
            (child) => child.name !== page.name
        );
    } else {
        project = project.filter((node) => node.name !== page.name);
    }
    return project
}

function getNodeByName(project: Page[], name: string): Page | undefined {
    return findNodeByName(project, name);
}

function getNodeById(nodes: any, id: string ): Page | undefined {
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

function findNodeByName(nodes: any, name: string): Page | undefined {
    if (nodes.length > 0) {
        for (const node of nodes) {
            if (node.name === name) {
                return node;
            }
            if (node.children) {
                const foundNode = findNodeByName(node.children, name);
                if (foundNode) {
                    return foundNode;
                }
            }
        }
    }
    return undefined;
}

function findParentNode(nodes: Page[], targetNode: Page): Page | undefined {
    for (const node of nodes) {
        if (node.children) {
            if (node.children.includes(targetNode)) {
                return node;
            }
            const parentNode = findParentNode(node.children, targetNode);
            if (parentNode) {
                return parentNode;
            }
        }
    }
    return undefined;
}

function printTree(nodes: any, level = 0) {
    let tree = ""
    if (nodes instanceof Array) {
        const sortedNodes = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

        for (const node of sortedNodes) {
            const indentation = leftpad(level);
            tree += (`${indentation}${node.name}`) + "\n"
            if (node.children) {
                tree += printTree(node.children, level + 1);
            }
        }
    }
    else {
        //we hit this else when we are passing in a page as the root node
        if (nodes.children) {
            const indentation = leftpad(level)
            tree += (`${indentation}${nodes.name}`) + "\n"
            tree += printTree(nodes.children, level + 1);
        }
    }

    return tree;
}

function leftpad(indents: number) {
    let padding: string = ""
    for (let i = 0; i < indents; i++) [
        padding += "    "
    ]
    return padding
}

function getExtension(page: Page): string {
    const type = page.type
    if (type === 'folder') {
        return ".dir";
    }
    else if (type === "rust") {
        return ".rs";
    }

    else return type ? "." + type : "";
}


export { addPage, getNodeByName, getNodeById, Page}
