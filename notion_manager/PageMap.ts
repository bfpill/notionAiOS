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

interface page { 
    name: string, 
    id: string,
    type?: string
}

class PageMap { 
    map: Map<string, {id: string, type: string}>
    archive: Map<string, {id: string, type: string}>

    constructor(databaseId: string){
        console.log("Initalized and ready to roll")
        this.map = new Map(Object.entries(jsonMap))
        this.archive = this.map;
    }

    add(page: page){ 
        page.type = page.type ? page.type : "Unknown"
        console.log("added pair")
        this.map.set(page.name, {id: page.id, type: page.type})
        this.updateJSON(this.map)
    }

    delete(page: page){ 
        page.type = page.type ? page.type : "Unknown"
        this.archive.set(page.name, {id: page.id, type: page.type})
        this.map.delete(page.name)
        this.updateJSON(this.map)
    }

    //haha cool 
    get(name: page["name"]){
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

    updateJSON(map: Map<string, {id: string, type: string}>){
        const updatedJSONMap = Object.fromEntries(this.map)
        const updatedJSONData = JSON.stringify(updatedJSONMap)

        fs.writeFileSync(fullPath, updatedJSONData, 'utf8')
    }
}

export default PageMap