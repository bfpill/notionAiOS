import express from 'express';

import notionController from "./notionController"

const router = express.Router();

router.post("/sgsgs", notionController.updateProperty);

router.get("/codeBlock", notionController.getBlock);
router.get("/", notionController.getChildBlocks);
router.delete("/codeBlock", notionController.deleteBlock);

router.patch("/codeBlock", notionController.updateCodeBlock);
//router.patch("/codeBlock", notionController.updateCodeBlock);

// Export router
export default router;