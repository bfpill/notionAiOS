import { Client } from "@notionhq/client";
import PageTree from "./PageTree";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://icon-library.com/images/black-and-white-folder-icon/black-and-white-folder-icon-5.jpg"
const fileIconUrl = "https://static.thenounproject.com/png/1171-200.png"

async function createPage(notion: Client, pages: PageTree, parentId: string, pageName: string, type: string) {

    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl

    console.log(icon)
    let response;

    if (pages.getNodeByName(pageName) !== "Name does not exist.") {
        return { Error: "Page name already exists, no duplicates please" };
    }

    if (pages.getNodeByName(parentId) !== "Name does not exist.") {
        parentId = pages.getNodeByName(parentId)["id"]
    }

    let parentName = pages.getNodeById(parentId)?.name
    //Quality of life, may be something to tell the AI about, maybe not
    if (IDisRoot(parentId)) {
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
                "database_id": DATABASEID
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
        try {
            const parentType = pages.getNodeById(parentId)?.type

            if (parentType !== "folder") {
                console.log(parentType)
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
        } catch (e: any) {
            if (e instanceof TypeError) {
                return ("The provided parentID does not exist: " + e)
            }
            return ("Error: " + e)
        }
    }

    pages.add({ name: pageName, id: response.id, type: type }, parentName )

    return { "pageId": response.id, "pageParent": response.parent };
}

async function getPage(notion: Client, pageId: string): Promise<any> {
    const page = await notion.pages.retrieve({
        page_id: pageId
    })

    return page
}

/*

async function getPagesFromPage(notion: Client, pages: PageMap, id: string, depth: number): Promise<string> {
    const page = await getPage(notion, id)
    const pageName = getPageName(page)

    const type = getPageType(pages, pageName);

    let childPageNames: string = ""

    childPageNames += leftPad(depth, pageName + getExtension(type)) + "\n"
    if (type.toLowerCase() === 'folder') {
        const children = await notion.blocks.children.list({
            block_id: id
        });

        const childPages: any[] = children.results.filter((child) => child["type"] === 'child_page');


        for (const childPage of childPages) {
            const pageName = childPage.child_page.title;

            const childPageId = pages.get(pageName)["id"];
            if (childPageId) {
                const subPages = await getPagesFromPage(notion, pages, childPageId, (depth + 1));
                childPageNames += subPages
            }
        }
    }

    return childPageNames;
}

function getExtension(type: string): string { 
    if(type === 'folder'){
        return ".dir";
    }
    else if(type === "rust"){
        return ".rs";
    }
    else return type;
}

async function getPagesTree(notion: Client, pages: PageMap, rootId: string): Promise<string> {

    if (IDisRoot(rootId)) {
        const childPages = await notion.databases.query({
            database_id: DATABASEID
        });

        let all: string = ""

        for (const page of childPages.results) {
            const pageName = getPageName(page)
            const pageType = getPageType(pages, pageName)

            if (pageType === 'folder') {
                all += (await getPagesFromPage(notion, pages, page.id, 1))
            }

            else { 
                all += pageName + getExtension(pageType)
            }
        }
        console.log(all)
        return all;
    }

    else if (pages.get(rootId) !== "Name does not exist.") {
        rootId = pages.get(rootId)["id"]
    }

    const page = getPage(notion, rootId)

    const pageName = getPageName(page)
    let all: string = pageName + "\n"
    all += await getPagesFromPage(notion, pages, rootId, 1)

    console.log(all)
    return all;

}*/


function getPageName(page: any) {
    try {
        return page["properties"].Name.title[0].text.content;
    } catch (e: any) {
        if (e instanceof TypeError) {
            try {
                return page["properties"].title.title[0].text.content;
            } catch (e: any) {
                return "Could not get Page name";
            }
        }
    }

}

function IDisRoot(id: string): boolean {
    if (id.toLowerCase() === "root") {
        return true;
    }
    return false;
}

function getPagesTree (pages: PageTree) { 
    pages.printTree()
}

export default { createPage, getPagesTree}