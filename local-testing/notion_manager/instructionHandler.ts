import { insertCodeByLine, toArray, deleteLines } from "./codeBlockFunctions"

function executeInstruction(oldCode: Array<string>, instruction: string) : (boolean | string)[] | (boolean | string[])[] {
    const commands = toArray(instruction, " ")
    if (commands.length < 3 || commands.length > 5) {
        return [false, "Command was not formatted correctly and likely contains syntax error or was incomplete"];
    }

    let commandHeader: string;
    try {
        commandHeader = commands[0];
    } catch (e: any) {
        if (e instanceof TypeError) {
            return ([false, "Command contained syntax error could not be parsed"]);
        }
        return ([false, "Unknown error: " + e]);
    }

    if (commandHeader === "INSERT") {
        let lineNumber: number;
        try {
            lineNumber = parseInt(commands[1])
        } catch (e) {
            if (e instanceof TypeError) {
                return ([false, "lineNumber was not an Integer"]);
            }
            return ([false, "Error: could not parse lineNumber. Receipt " + e]);
        }
        try {
            let codeToInsert: string;
            try {
                codeToInsert = commands[2]
            } catch (e) {
                return ([false, "Error: could not parse codeToInsert. Receipt " + e]);
            }

            // return the updatedCode
            const updatedCode = insertCodeByLine(oldCode, codeToInsert, lineNumber)
            if (updatedCode instanceof TypeError) {
                return [false, "Could not insert" + codeToInsert + "at " + lineNumber]
            }
            return [true, updatedCode];
        } catch (e: any) {
            return ([false, "Could not complete insertion, unknown error: " + e]);
        }
    }

    else if (commandHeader === "DELETE") {
        let startNumber: number, endNumber: number

        try {
            startNumber = parseInt(commands[1])
            endNumber = parseInt(commands[2])
} catch (e) {
            if (e instanceof TypeError) {
                return ([false, "Error: " + e]);
            }
            return ([false, "Error: could not parse lineNumber. Receipt " + e]);
        }

        const updatedCode = deleteLines(oldCode, startNumber, endNumber)
        return updatedCode;

    } else {
        return ([false, "Command header likely contained syntax error"]);
    }
}

export { executeInstruction }
