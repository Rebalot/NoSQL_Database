import Joi from "joi";
import { createManyStudents, createOneStudent, deleteOneStudent, findStudents, updateStudentWithSubject } from "../services/studentService.js";

const studentSchema = Joi.object({
  studentId: Joi.number().integer().positive().required(),
  name: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).required(),
  lastName: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).required(),
  birthDate: Joi.date().required(),
  group: Joi.string().pattern(/^[a-zA-ZÀ-ÿ0-9]+(?:[-][a-zA-ZÀ-ÿ0-9]+)*$/).optional(),
  subjects: Joi.array().items(
    Joi.object({
      subject_id: Joi.string().length(24).pattern(/^[a-z0-9]+$/).required(),
      grade: Joi.number().min(0).max(100).optional()
    })
  )
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
    const { error, value } = studentSchema.validate(req.body);
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
    const schema = Joi.array().items(studentSchema).required();
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
const updatePartialStudent = async (req, res) => {
  try {
    const updateStudentSchema = studentSchema.fork(["studentId", "name", "lastName", "birthDate"], field => field.optional());
    const { error, value } = updateStudentSchema.validate(req.body);
    // console.log(value);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const updatedStudent = await updateStudentWithSubject(req.params.id, value);
    res.status(200).json(updatedStudent);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
};
// const updateCompleteStudent = async (req, res) => {
//   try {
//     const updateStudentSchema = studentSchema.fork(["studentId", "name", "lastName", "birthDate"], field => field.optional());
//     const { error, value } = updateStudentSchema.validate(req.body);
//     // console.log(value);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }
//     const updatedStudent = await Students.findByIdAndUpdate(
//       req.params.id,
//       value,
//       { new: true, runValidators: true }
//     );
//     res.status(200).json(updatedStudent);
//   } catch (err) {
//     console.error(err.message);
//     res.status(400).json({ error: err.message });
//   }
// };
const deleteStudent = async (req, res) => {
  try {
    const deletedStudent = await deleteOneStudent(req.params.id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export {
  getStudents,
  createStudent,
  createStudents,
  updatePartialStudent,
  deleteStudent
};
