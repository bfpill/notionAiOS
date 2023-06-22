import express from 'express';

import notionController from "./notionController"

const router = express.Router();

router.post("/sgsgs", notionController.updateProperty);

router.get("/codeBlock", notionController.getBlock);
router.get("/", notionController.getChildBlocks);
router.delete("/", notionController.deleteBlock);


router.patch("/codeBlock", notionController.replaceCodeBlockLines);
router.delete("/codeBlock", notionController.deleteCodeBlockLines);

// Export router
export default router;
