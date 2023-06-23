import { Client } from "@notionhq/client";

async function createPage(notion: Client, databaseId: string, pageName: string, type: string) {
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
            }, 
            "Type": {
                "rich_text": [
                    {
                        "text": {
                            "content": type
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

async function getPageType(notion: Client, pageId: string){ 
    const response = await notion.pages.retrieve({ 
        page_id: pageId
    })

    const type = response["properties"].Type.rich_text[0].plain_text
    return { type: type }
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

export default { createPage, getPages, getPageType }