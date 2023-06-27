async function getCodeBlock(block) {
    if (block['type'] !== "code") {
        return "Not a code block";
    }
    const code = extractCode(block);
    const properties = getCodeBlockProperties(block);
    const codeBlock = { code: code, properties: properties };
    return codeBlock;
}
function getCodeBlockProperties(block) {
    const parentId = block["parent"].page_id;
    const language = block["code"].language;
    return { parentId: parentId, fileType: language };
}
function extractCode(block) {
    const code = block["code"].rich_text[0].text.content;
    return code;
}
function deleteLines(previousCode, startLine, endLine) {
    const previousCodeLength = previousCode.length;
    console.log(previousCode, startLine, endLine);
    if (testLineExists(startLine, previousCodeLength) && testLineExists(endLine, previousCodeLength)) {
        const before = previousCode.slice(0, startLine - 1);
        console.log("Before: " + before);
        const after = previousCode.slice(endLine);
        console.log("After: " + after);
        const updatedCode = before.concat(after);
        return [true, updatedCode];
    }
    return [false, previousCode];
}
function toArray(code, delimiter) {
    const lines = code.split(delimiter);
    return lines;
}
function insertCodeByLine(previousCode, newCode, lineNumber) {
    const codeLength = previousCode.length;
    console.log(lineNumber, codeLength);
    if (!(lineNumber < 1 || lineNumber > codeLength + 1)) {
        const before = previousCode.slice(0, lineNumber - 1);
        const after = previousCode.slice(lineNumber - 1, codeLength);
        const updatedCode = before.concat(newCode, after);
        console.log(updatedCode);
        return updatedCode;
    }
    else {
        return TypeError("Line number was out of Range");
    }
}
function testLineExists(lineNumber, length) {
    if (lineNumber < 1 || lineNumber > length) {
        console.log("Line Number " + lineNumber + " is Invalid");
        return false;
    }
    return true;
}
export { getCodeBlock, getCodeBlockProperties, extractCode, insertCodeByLine, toArray, testLineExists as testLineValid, deleteLines };
//# sourceMappingURL=codeBlockFunctions.js.map