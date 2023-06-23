interface Pair { 
    name: string, 
    id: string
}

class PageMap { 

    map: Map<string, string>
    archive: Map<string, string>

    constructor(databaseId: string){
        console.log("Initalized and ready to roll")
        this.map = new Map<string, string>()
        this.archive = this.map;
    }

    add(pair: Pair){ 
        console.log("added pair")
        this.map.set(pair.name, pair.id)
    }

    delete(pair: Pair){ 
        this.archive.set(pair.name, pair.id)
        this.map.delete(pair.name)
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
}

export default PageMap