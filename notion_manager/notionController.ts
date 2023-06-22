import notionServices from "./notionServices";

const updateProperty = async (req, res) => {
    const { body } = req
    if (
        !body.pageId ||
        !body.propertyName ||
        !body.content
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                        "Error occurred because you failed to provide a clone key or a message"
                },
            });
        return;
    }
    const { pageId, propertyName, content} = body;
    const messageResponse =  await notionServices.updateProperty(pageId, propertyName, content);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const getChildBlocks = async (req, res) => {
    const { body } = req
    if (
        !body.pageId
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                       "Error becuase you prolly forgot a property"
                },
            });
        return;
    }
    const { pageId, propertyName} = body;
    const messageResponse =  await notionServices.getChildBlocks(pageId, propertyName);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const updateCodeBlock = async (req, res) => { 
    const { body } = req
    if (
        !body.command || 
        !body.blockId
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                       "Error becuase you prolly forgot a property"
                },
            });
        return;
    }

    let messageResponse: any;

    if(body.command === "DELETE LINES") { 
        const { _, blockId, startLine, endLine } = body
        messageResponse =  await notionServices.deleteCodeBlockLines(blockId, startLine, endLine);
    }
  
    else if (body.command === "REPLACE LINES") { 
        const blockId = body.blockId
        const codeToInsert = body.code
        const startLine = body.startLine
        const endLine = body.endLine
        messageResponse =  await notionServices.replaceCodeBlockLines(blockId, codeToInsert, startLine, endLine);
    }

    else { 
        messageResponse =  {completed: false, result: "Could not parse command"}
    }

    if(messageResponse[0]){
        res.status(201).send({ status: "OK", data: {messageResponse} });
    }

    else if (!messageResponse[0]){
        res.status(201).send({ status: "Error", data: {messageResponse} });
    }

}

const deleteBlock = async (req, res) => {
    const { body } = req
    if (
        !body.blockId
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                       "Error becuase you probably forgot a property"
                },
            });
        return;
    }
    const { blockId, lineNumber, code } = body;
    console.log(blockId, lineNumber, code )
    const messageResponse =  await notionServices.deleteBlock(blockId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

const getBlockCode = async (req, res) => {
    const { body } = req
    if (
        !body.blockId
    ) {
        res
            .status(400)
            .send({
                status: "FAILED",
                data: {
                    error:
                       "Error becuase you prolly forgot a property"
                },
            });
        return;
    }
    const { blockId} = body;
    const messageResponse =  await notionServices.getBlockAsArray(blockId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

export default {
    updateProperty,
    getChildBlocks,
    getBlockCode,
    deleteBlock, 
    updateCodeBlock
};
