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
    id?: string;
    type?: string;
    codeId?: string;
    children?: Page[];
    content?: any
}

interface CreatePageRequest { 
    name: string;
    type: string;
    content?: string;
}

export { CodeBlock, Block, CodeProperties, Page, CreatePageRequest } 