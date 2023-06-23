import { Client } from "@notionhq/client";

async function createPage(notion: Client, pageName: string, databaseId: string) {
    const response = await notion.pages.create({
        "icon": { 
            "type":  "external",
            "external": { 
                "url" : "https://static.thenounproject.com/png/3218908-200.png"
            }
        },
        "parent": {
            "type": "database_id",
            "database_id": databaseId
        },
        "properties": {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": pageName
                        }
                    }
                ]
            }
        },
        "children": [
        ]
    })

    return { "pageId" : response.id };
}

async function getPages(notion: Client, databaseId){ 
    const response = await notion.databases.query({
        database_id: databaseId
    })

    let pages: Array<Object> = [];
    response.results.forEach((page) => { 
        const name = page["properties"].Name.title[0].text["content"]
        const id = page.id
        return pages.push({name: name, id: id})
    })

    return pages;
}

export default { createPage, getPages }