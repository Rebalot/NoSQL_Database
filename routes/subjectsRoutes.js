import express from "express";
import { createStudentsInSubject, createSubject, createSubjects, deleteStudentsFromSubject, getSubjects, hardDeleteSubject, softDeleteSubject, updateSubjectInfo } from "../controllers/subjectsController.js";

const router = express.Router();

router.get("/subjects", getSubjects);
router.post("/subjects/create-single", createSubject); // with subject body
router.post("/subjects/create-multiple", createSubjects); // with subjects body
router.post("/subjects/:subjectId/students/add", createStudentsInSubject); // with students body
router.patch("/subjects/update-info/:subjectId", updateSubjectInfo); // with subject info body
router.delete("/subjects/:subjectId/students/remove", deleteStudentsFromSubject); // with students body
router.delete("/subjects/hard-delete/:subjectId", hardDeleteSubject);
router.delete("/subjects/soft-delete/:subjectId", softDeleteSubject);
export default router;
