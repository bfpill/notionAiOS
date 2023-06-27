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

export { CodeBlock, Block, CodeProperties } 