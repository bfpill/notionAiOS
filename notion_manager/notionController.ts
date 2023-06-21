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
    console.log("HITTsd")
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
        !body.blockId || 
        !body.instructions
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
    const { blockId, instructions } = body;
    console.log(blockId, instructions)
    const messageResponse =  await notionServices.updateCodeBlockHandler(blockId, instructions);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

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

const getBlock = async (req, res) => {
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
    const messageResponse =  await notionServices.getBlock(blockId);

    res.status(201).send({ status: "OK", data: {messageResponse} });
};

export default {
    updateProperty,
    getChildBlocks,
    updateCodeBlock, 
    getBlock, 
    deleteBlock
};