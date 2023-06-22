import express from 'express';

import notionController from "./notionController"

const router = express.Router();

router.post("/sgsgs", notionController.updateProperty);

router.get("/codeBlock", notionController.getBlockCode);
router.get("/", notionController.getChildBlocks);
router.delete("/", notionController.deleteBlock);

router.post("/codeBlock", notionController.updateCodeBlock);

// Export router
export default router;
