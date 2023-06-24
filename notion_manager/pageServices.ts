import { Client } from "@notionhq/client";
import PageMap from "./pageMap";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://www.simpleimageresizer.com/_uploads/photos/5aea8c02/file_folder_icon_218858_10.png"
const fileIconUrl = "https://www.simpleimageresizer.com/_uploads/photos/5aea8c02/6528597_10.png"

async function createPage(notion: Client, pages: PageMap, parentId: string, pageName: string, type: string) {

    const icon = type.toLowerCase() === "folder" ? folderIconURL : fileIconUrl
    let response;

    if(pages.get(pageName) !== "Name does not exist."){ 
        return { Error: "Page name already exists, no duplicates please" };
    }

    if(pages.get(parentId) !== "Name does not exist." ){
        parentId = pages.get(parentId)
    }

    //Quality of life, may be something to tell the AI about, maybe not
    parentId = parentId.toLowerCase() === "root" ? DATABASEID : parentId;
    if (parentId === DATABASEID) {

        console.log("adding to root")
        response = await notion.pages.create({
            "icon": {
                "type": "external",
                "external": {
                    "url": icon
                }
            },
            "parent": {
                "type": "database_id",
                "database_id": parentId
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
    }

    else {
        const parentType = await getPageInfo(notion, parentId)
        if (parentType["type"].toLowerCase() !== "folder") {
            return { Error: "Could not add page, parent was not a folder or was outside the project scope" }
        }

        response = await notion.pages.create({
            "icon": {
                "type": "external",
                "external": {
                    "url": icon
                }
            },
            "parent": {
                "type": "page_id",
                "page_id": parentId
            },
            "properties": {
                "title": {
                    "title": [
                        {
                            "text": {
                                "content": pageName
                            }
                        }
                    ]
                }
            },
        })


    }

    //yeah i dont know why this is in an object either but its cool ish
    pages.add({ name: pageName, id: response.id })

    return { "pageId": response.id, "pageParent": response.parent };
}

async function getPageInfo(notion: Client, pageId: string) {
    try {
        const page = await notion.pages.retrieve({
            page_id: pageId
        })

        const type = getPageType(page)
        const id = page.id
        let parentType = page["parent"].type

        let parentId: string = "Unknown"
        if (parentType === "database_id") {
            parentId = page["parent"].database_id
            parentType = "database"
        }
        else if (parentType === "page_id") {
            parentId = page["parent"].page_id
            parentType = "folder"
        }

        return { type: type, id: id, parent: { type: parentType, id: parentId } }
    } catch (e: any) {
        return "Could not retrieve Page, it is likely the passed pageId was for a database."
    }
}

function getPageType(page): string {
    const icon = page["icon"].external.url
    return icon === folderIconURL ? "folder" : "code"
}

async function getPagesFlat(notion: Client, databaseId) {
    const response = await notion.databases.query({
        database_id: databaseId
    })

    let pages: Array<Object> = [];
    response.results.forEach((page) => {
        const name = page["properties"].Name.title[0].text["content"]
        const id = page.id
        return pages.push({ name: name, id: id })
    })

    return pages;
}

async function getPagesFromPage(notion: Client, pages: PageMap, id: string): Promise<string[]> {
    const page = await notion.pages.retrieve({
        page_id: id
    });
    const type = getPageType(page);

    const childPageNames: string[] = [];
    if (type.toLowerCase() === 'folder') {
        const children = await notion.blocks.children.list({
            block_id: id
        });

        const childPages: any[] = children.results.filter((child) => child["type"] === 'child_page');


        for (const childPage of childPages) {
            const pageName = childPage.child_page.title;
            childPageNames.push(pageName);

            const childPageId = pages.get(pageName);
            if (childPageId) {
                const subPages = await getPagesFromPage(notion, pages, childPageId);
                childPageNames.push(...subPages);
            }
        }
    }

    return childPageNames;
}

async function getPagesTree(notion: Client, pages: PageMap, rootId: string) //: Promise<string[]> 
{       
    rootId = rootId.toLowerCase() === "root" ? DATABASEID : rootId
    if(pages.get(rootId) !== "Name does not exist." ){
        rootId = pages.get(rootId)
    }

    if (rootId === DATABASEID) {
        console.log('was database');
        const childPages = await notion.databases.query({
            database_id: rootId
        });

        let all: any[] = [];

        for(const page of childPages.results) { 
            all.push(page.id)
            if(getPageType(page) === 'folder'){
                console.log("folder")
                all.push(await getPagesFromPage(notion, pages, page.id))
            }
        }
        return all;
    } else {
        const page = await notion.pages.retrieve({
            page_id: rootId
        });

        console.log(page.id)

        console.log(getPagesFromPage(notion, pages, rootId))
    }
}

export default { createPage, getPagesFromPage, getPageType, getPagesTree, getPageInfo }