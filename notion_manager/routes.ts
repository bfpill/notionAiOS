import express from 'express';

import notionController from "./notionController"

const router = express.Router();

router.get("/codeBlock", notionController.getBlockCode);
router.post("/pageActions", notionController.pageActions);
router.delete("/", notionController.deleteBlock);

router.post("/codeBlock", notionController.updateCodeBlock);

// Export router
export default router;
