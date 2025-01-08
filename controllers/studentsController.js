import Joi from "joi";
import { addSubjectInStudent, createManyStudents, createOneStudent, findStudents, hardDeleteOneStudent, removeSubjectFromStudent, softDeleteOneStudent, updateGradeInStudent, updateOneStudentInfo } from "../services/studentService.js";

const studentSubjectSchema = Joi.object({
  subject_id: Joi.string().length(24).pattern(/^[a-z0-9]+$/).required(),
  grade: Joi.number().min(0).max(100).optional()
});
const createStudentSchema = Joi.object({
  studentId: Joi.number().integer().positive().required(),
  name: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).required(),
  lastName: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).required(),
  birthDate: Joi.date().required(),
  group: Joi.string().pattern(/^[a-zA-ZÀ-ÿ0-9]+(?:[-][a-zA-ZÀ-ÿ0-9]+)*$/).optional(),
  subjects: Joi.array().items(studentSubjectSchema).optional(),
  active: Joi.boolean().optional()
});
const updateStudentInfoSchema = Joi.object({
  studentId: Joi.number().integer().positive().optional(),
  name: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).optional(),
  lastName: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).optional(),
  birthDate: Joi.date().optional(),
  group: Joi.string().pattern(/^[a-zA-ZÀ-ÿ0-9]+(?:[-][a-zA-ZÀ-ÿ0-9]+)*$/).optional(),
  active: Joi.boolean().optional()
});

const getStudents = async (req, res) => {
  try {
    const students = await findStudents(req.query);
    if (!students || students.length === 0) {
      return res.status(404).json({ message: "Students not found" });
    }
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const createStudent = async (req, res) => {
  try {
    const { error, value } = createStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const student = await createOneStudent(value);
    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const createStudents = async (req, res) => {
  try {
    const schema = Joi.array().items(createStudentSchema).required();
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const students = await createManyStudents(value);
    res.status(201).json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};
const createSubjectInStudent = async (req, res) => {
  try {
    const { error, value } = studentSubjectSchema.validate(req.body);
    // console.log(value);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const student = await addSubjectInStudent(req.params.studentId, value);
    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const deleteSubjectFromStudent = async (req, res) => {
  try {
    const student = await removeSubjectFromStudent(req.params.studentId, req.params.subjectId);
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const updateStudentInfo = async (req, res) => {
  try {
    const { error, value } = updateStudentInfoSchema.validate(req.body);
    // console.log(value);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.log(req.params.studentId, value);
    const updatedStudent = await updateOneStudentInfo(req.params.studentId, value);
    res.status(200).json(updatedStudent);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
};
const updateStudentGrade = async (req, res) => {
  try {
    const updatedStudentSubjectSchema = studentSubjectSchema.fork(["grade"], field => field.required());
    const { error, value } = updatedStudentSubjectSchema.validate(req.body);
    // console.log(value);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const updatedStudent = await updateGradeInStudent(req.params.studentId, value);
    res.status(200).json(updatedStudent);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
};
const hardDeleteStudent = async (req, res) => {
  try {
    const deletedStudent = await hardDeleteOneStudent(req.params.studentId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const softDeleteStudent = async (req, res) => {
  try {
    const deletedStudent = await softDeleteOneStudent(req.params.studentId);
    // Se actualiza el estudiante para que aparezca con active: false
    res.status(200).json(deletedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
export {
  getStudents,
  createStudent,
  createStudents,
  createSubjectInStudent,
  deleteSubjectFromStudent,
  updateStudentInfo,
  updateStudentGrade,
  hardDeleteStudent,
  softDeleteStudent
};
