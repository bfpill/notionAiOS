import  { getCodeBlock, getCodeBlockProperties, insertCodeByLine, extractCode, toArray, testLineValid }  from "./codeBlockFunctions"
import { Block, CodeBlock, CodeProperties } from "./interfaces"

function executeInstruction(oldCode: Array<string>, instruction: string){
    const commands = toArray(instruction, " ")
    if(commands.length < 3 || commands.length > 5){
        return [false, "Command was not formatted correctly and likely contains syntax error or was incomplete"];
    }

    let commandHeader: string;
    try{ 
        commandHeader = commands[0];
    } catch (e: any) { 
        if(e instanceof TypeError){
            return ([false, "Command contained syntax error could not be parsed"]);
        }
        return("Unknown error: " + e);
    }

    if(commandHeader === "INSERT"){
        try{ 
            let lineNumber: number;
            try{ 
                lineNumber = parseInt(commands[1])  
            } catch (e){ 
                if(e instanceof TypeError){
                    return ([false, "lineNumber was not an Integer"]);
                }
                return ([false, "Error: could not parse lineNumber. Receipt " + e]);
            }
            let codeToInsert: string;
            try{ 
                codeToInsert = commands[2]
            } catch (e){ 
                return ([false, "Error: could not parse codeToInsert. Receipt " + e]);
            }
            
            // return the updatedCode
            const inserted = insertCodeByLine(oldCode, codeToInsert, lineNumber)
            if(inserted instanceof TypeError){
                return [false, "Could not insert" + codeToInsert + "at " + lineNumber]
            }
            return [true, inserted];
        } catch (e: any){
            return ([false, "Could not complete insertion, unknown error: " + e]);
        }
    }

    else if(commandHeader === "DELETE"){
        try{ 
            
        } catch (e: any){
    
        }
    } else{ 
        return [false, "Command header likely contained syntax error"];
    }

    return [false, "To be changed"]
}

export { executeInstruction }