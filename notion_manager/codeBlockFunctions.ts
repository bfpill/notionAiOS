import { start } from "repl";
import { Block, CodeBlock, CodeProperties } from "./interfaces"

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
    console.log(parentId, language)
    return  {parentId: parentId, fileType: language};
}

function extractCode(block: Block) : string{
    const code = block["code"].rich_text[0].text.content
    return code;
}

function deleteLines(previousCode: Array<string>, startLine: number, endLine: number): Array<string> {
    const codeLength: number = previousCode.length;

    testLineValid(startLine, previousCode.length)
    testLineValid(endLine, previousCode.length) 

    const before: Array<string> = previousCode.slice(0, startLine - 1)
    const after: Array<string> = previousCode.slice(endLine - 1, codeLength)

    const updatedCode = before.concat(after)
    return updatedCode;
}

function toArray(code: string, delimiter: string): Array<string> { 
    const lines: Array<string> = code.split(delimiter)
    return lines;
}

function insertCodeByLine(previousCode: Array<string>, newCode: string, lineNumber: number): Array<string> | TypeError {
    const codeLength: number = previousCode.length;
    if(testLineValid(lineNumber, previousCode.length)){
        const before: Array<string> = previousCode.slice(0, lineNumber - 1)
        const after: Array<string> = previousCode.slice(lineNumber - 1, codeLength)
    
        const updatedCode = before.concat(newCode, after)
        return updatedCode;
    }
    else{
        return TypeError("Line number was out of Range");
    }
}

function testLineValid(lineNumber, length) {
    console.log(length)
    if (lineNumber < 1 || lineNumber > length) {
        console.log("Line Number is Invalid");
        return false;
    }
    return true;
}

export {getCodeBlock, getCodeBlockProperties, extractCode, insertCodeByLine, toArray, testLineValid}