import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const filename = 'pageTree.json';

const currentModuleUrl = import.meta.url;
const currentModulePath = fileURLToPath(currentModuleUrl);
const parentDirPath = path.dirname(path.dirname(currentModulePath));
const dataFolderPath = path.join(parentDirPath, 'data');
const fullPath = path.join(dataFolderPath, filename);
const jsonData = fs.readFileSync(fullPath, 'utf8');

const jsonMap = JSON.parse(jsonData)

interface Pair { 
    name: string, 
    id: string
}

class PageMap { 
    map: Map<string, string>
    archive: Map<string, string>

    constructor(databaseId: string){
        console.log("Initalized and ready to roll")
        this.map = new Map(Object.entries(jsonMap))
        this.archive = this.map;
    }

    add(pair: Pair){ 
        console.log("added pair")
        this.map.set(pair.name, pair.id)
        this.updateJSON(this.map)
    }

    delete(pair: Pair){ 
        this.archive.set(pair.name, pair.id)
        this.map.delete(pair.name)
        this.updateJSON(this.map)
    }

    //haha cool 
    get(name: Pair["name"]){
        const id = this.map.get(name)
        if(id === undefined){ 
            const checkArchive = this.archive.get(name)
            if(checkArchive === undefined){ 
                return "Name does not exist."
            }
            return "The page has been archived and no longer exists."
        }

        return id;
    }

    updateJSON(map: Map<string, string>){
        const updatedJSONMap = Object.fromEntries(this.map)
        const updatedJSONData = JSON.stringify(updatedJSONMap)

        fs.writeFileSync(fullPath, updatedJSONData, 'utf8')
    }
}

export default PageMap