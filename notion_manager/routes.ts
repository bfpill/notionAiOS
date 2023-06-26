import express from 'express';

import notionController from "./notionController"

const router = express.Router();

router.post("/pageActions", notionController.pageActions);

router.post("/blockActions", notionController.blockActions);
router.get("/blockActions", notionController.getBlockCode);

router.post("/pages", notionController.createPage)

router.post("/filetree", notionController.getPages)

// Export router
export default router;
