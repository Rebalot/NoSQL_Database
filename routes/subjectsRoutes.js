import express from "express";
import { createSubjects, getSubjects } from "../controllers/subjectsController.js";
const router = express.Router();

router.get("/subjects", getSubjects);
// router.post("/subjects", createStudent);
router.post("/subjects", createSubjects);
// router.patch("/subjects/:id", updateStudent);
export default router;
