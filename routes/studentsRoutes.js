import express from "express";
import { createStudent, createStudents, getStudents, updateStudentInfo, hardDeleteStudent, softDeleteStudent, createSubjectInStudent, updateStudentGrade, deleteSubjectFromStudent } from "../controllers/studentsController.js";

const router = express.Router();

router.get("/students", getStudents); // with query params
router.post("/students/create-single", createStudent); // with student body
router.post("/students/create-multiple", createStudents); // with students body
router.post("/students/:studentId/subjects/add", createSubjectInStudent); // with subject body
router.patch("/students/update-info/:studentId", updateStudentInfo); // with student info body
router.patch("/students/update-grade/:studentId", updateStudentGrade); // with subject body
router.delete("/students/:studentId/subjects/remove/:subjectId", deleteSubjectFromStudent);
router.delete("/students/hard-delete/:studentId", hardDeleteStudent);
router.delete("/students/soft-delete/:studentId", softDeleteStudent);

export default router;
