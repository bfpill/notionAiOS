import express from 'express';

import notionController from "../controllers/controller.js"

const router = express.Router();

router.post("/pageActions", notionController.pageActions);

router.post("/blockActions", notionController.blockActions);
router.get("/blockActions", notionController.getBlockCode);

router.post("/pages", notionController.createPage)
router.post("/tags", notionController.addProjectTags)
router.post("/filetree", notionController.getPages)
router.post("/project", notionController.createProject)
router.post("/downloadLink", notionController.getDownloadLink)
// Export router
export default router;
