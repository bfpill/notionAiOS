interface CodeBlock { 
    code?: string, 
    properties?: CodeProperties;
}

interface Block { 
    object: "block", 
    id: string
}

interface CodeProperties {
    parentId: string,
    fileType: string
};

interface Page {
    name: string;
    id: string;
    type?: string;
    children?: Page[];
    content?: any
}

export { CodeBlock, Block, CodeProperties, Page } 