import express from "express";
import { createStudent, createStudents, getStudents, updatePartialStudent, deleteStudent } from "../controllers/studentsController.js";
const router = express.Router();

router.get("/students", getStudents);
router.post("/students/create-single", createStudent);
router.post("/students/create-multiple", createStudents);
router.patch("/students/update-partial/:id", updatePartialStudent);
router.delete("/students/destroy/:id", deleteStudent);
export default router;
