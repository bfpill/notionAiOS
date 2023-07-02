import { Block, CodeBlock, CodeProperties } from "../projecthandler/interfaces.js"

async function getCodeBlock(block) : Promise<CodeBlock | string> {
    if (block['type'] !== "code") {
        return "Not a code block";
    }

    const code: string = extractCode(block)
    const properties: CodeProperties = getCodeBlockProperties(block)

    const codeBlock: CodeBlock = {code: code, properties: properties}
    return codeBlock;
}

function getCodeBlockProperties (block): CodeProperties {
    const parentId: string = block["parent"].page_id
    const language: string = block["code"].language
    return  {parentId: parentId, fileType: language};
}

function extractCode(block: Block) : string{
    const code = block["code"].rich_text[0].text.content
    return code;
}

function deleteLines(previousCode: Array<string>, startLine: number, endLine: number): any {
    const previousCodeLength: number = previousCode.length;

    console.log(previousCode, startLine, endLine)
    if(testLineExists(startLine, previousCodeLength ) && testLineExists(endLine, previousCodeLength)){
        const before: Array<string> = previousCode.slice(0, startLine - 1)
        console.log("Before: " + before)

        const after: Array<string> = previousCode.slice(endLine)
        console.log("After: " + after)

        const updatedCode = before.concat(after)
        return updatedCode;
    }

    return undefined;
}

function toArray(code: string, delimiter: string): Array<string> {
    const lines: Array<string> = code.split(delimiter)
    return lines;
}

function insertCodeByLine(previousCode: Array<string>, newCode: string, lineNumber: number): Array<string> | TypeError {
    const codeLength: number = previousCode.length;
    console.log(lineNumber, codeLength)
    if(!(lineNumber < 1 || lineNumber > codeLength + 1 )){
        const before: Array<string> = previousCode.slice(0, lineNumber - 1)
        const after: Array<string> = previousCode.slice(lineNumber - 1, codeLength)

        const updatedCode = before.concat(newCode, after)
        console.log(updatedCode)
        return updatedCode;
    }
    else{
        return TypeError("Line number was out of Range");
    }
}

function testLineExists(lineNumber : number, length: number) {
    if (lineNumber < 1 || lineNumber > length) {
        console.log("Line Number " + lineNumber + " is Invalid")
        return false;
    }
    return true;
}

export {getCodeBlock, getCodeBlockProperties, extractCode, insertCodeByLine, toArray, testLineExists, deleteLines}
