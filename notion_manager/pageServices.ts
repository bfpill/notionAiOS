import { Client } from "@notionhq/client";
import PageMap from "./pageMap";

const DATABASEID = "244fbd23-36dc-46d5-a261-2c7dc9609f67"
const folderIconURL = "https://www.simpleimageresizer.com/_uploads/photos/5aea8c02/file_folder_icon_218858_10.png"
const fileIconUrl = "https://www.simpleimageresizer.com/_uploads/photos/5aea8c02/6528597_10.png"

async function createPage(notion: Client, pages: PageMap, parentId: string, pageName: string, type: string) {

    type = type.toLowerCase();
    const icon = type === "folder" ? folderIconURL : fileIconUrl
    let response;

    if (pages.get(pageName) !== "Name does not exist.") {
        return { Error: "Page name already exists, no duplicates please" };
    }

    if (pages.get(parentId) !== "Name does not exist.") {
        parentId = pages.get(parentId)["id"]
    }

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
            const parentPage = await getPage(notion, parentId)
            const parentName = getPageName(parentPage)
            const parentType = getPageType(pages, parentName)

            if (parentType !== "folder") {
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

    //yeah i dont know why this is in an object either but its cool ish
    pages.add({ name: pageName, id: response.id, type: type })

    return { "pageId": response.id, "pageParent": response.parent };
}

async function getPage(notion: Client, pageId: string): Promise<any> {
    const page = await notion.pages.retrieve({
        page_id: pageId
    })

    return page
}

function getPageType(pages: PageMap, page: any): string {
    const t = pages.get(page)
    if (t !== undefined) {
        return t["type"]
    }
    else {
        const icon = page["icon"].external.url
        return icon === folderIconURL ? "folder" : "code"
    }

}

function leftPad(indents: number, str: string) {
    let padding: string = ""
    for (let i = 0; i < indents; i++) [
        padding += "    "
    ]
    return padding + str
}

async function getPagesFromPage(notion: Client, pages: PageMap, id: string, depth: number): Promise<string> {
    const page = await getPage(notion, id)
    const pageName = getPageName(page)

    const type = getPageType(pages, pageName);

    let childPageNames: string = ""
    if (type.toLowerCase() === 'folder') {
        const children = await notion.blocks.children.list({
            block_id: id
        });

        const childPages: any[] = children.results.filter((child) => child["type"] === 'child_page');


        for (const childPage of childPages) {
            const pageName = childPage.child_page.title;
            childPageNames += "\n" + leftPad(depth, pageName)

            const childPageId = pages.get(pageName)["id"];
            if (childPageId) {
                const subPages = await getPagesFromPage(notion, pages, childPageId, (depth + 1));
                childPageNames += subPages
            }
        }
    }

    return childPageNames;
}

function getPageName(page) {
    try {
        return page["properties"].Name.title[0].text.content
    } catch (e: any) {
        if (e instanceof TypeError) {
            try {
                return page["properties"].title.title[0].text.content
            } catch (e: any) {
                return "Could not get Page name"
            }
        }
    }

}

function IDisRoot(id: string): boolean {
    if (id.toLowerCase() === "root") {
        return true;
    }
    return false
}

async function getPagesTree(notion: Client, pages: PageMap, rootId: string): Promise<string> {

    if (IDisRoot(rootId)) {
        const childPages = await notion.databases.query({
            database_id: DATABASEID
        });

        let all: string = ""

        for (const page of childPages.results) {
            const pageName = getPageName(page)
            all += pageName
            if (getPageType(pages, pageName) === 'folder') {
                all += (await getPagesFromPage(notion, pages, page.id, 1)) + "\n"
            }
        }
        console.log(all)
        return all;
    }

    else if (pages.get(rootId) !== "Name does not exist.") {
        rootId = pages.get(rootId)["id"]
    }

    const page = await notion.pages.retrieve({
        page_id: rootId
    });

    const pageName = getPageName(page)
    let all: string = pageName + "\n"
    all += await getPagesFromPage(notion, pages, rootId, 1)

    console.log(all)
    return all;

}

export default { createPage, getPagesFromPage, getPageType, getPagesTree }