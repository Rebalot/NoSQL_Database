import Joi from "joi";
import { addStudentsInSubject, createManySubjects, createOneSubject, findSubjects, hardDeleteOneSubject, removeStudentsFromSubject, softDeleteOneSubject, updateOneSubjectInfo } from "../services/subjectService.js";

const subjectStudentsSchema = Joi.array().items(
  Joi.string().length(24).pattern(/^[a-z0-9]+$/).required()
).required();
const createSubjectSchema = Joi.object({
  subject: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).required(),
  students_id: Joi.array().items(
    Joi.string().length(24).pattern(/^[a-z0-9]+$/).required()
  ).optional(),
  active: Joi.boolean().optional()
});
const updateSubjectInfoSchema = Joi.object({
  subject: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).optional(),
  active: Joi.boolean().optional()
});

const getSubjects = async (req, res) => {
  try {
    const subjects = await findSubjects(req.query);
    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ message: "Subjects not found" });
    }
    res.status(200).json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const createSubject = async (req, res) => {
  try {
    const { error, value } = createSubjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const subject = await createOneSubject(value);
    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const createSubjects = async (req, res) => {
  try {
    const schema = Joi.array().items(createSubjectSchema).required();
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const subjects = await createManySubjects(value);
    res.status(201).json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};
const createStudentsInSubject = async (req, res) => {
  try {
    const { error, value } = subjectStudentsSchema.validate(req.body);
    console.log(value);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const subject = await addStudentsInSubject(req.params.subjectId, value);
    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const deleteStudentsFromSubject = async (req, res) => {
  try {
    const { error, value } = subjectStudentsSchema.validate(req.body);
    // console.log(value);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const subject = await removeStudentsFromSubject(req.params.subjectId, value);
    res.status(200).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const updateSubjectInfo = async (req, res) => {
  try {
    const { error, value } = updateSubjectInfoSchema.validate(req.body);
    // console.log(value);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const updatedSubject = await updateOneSubjectInfo(req.params.subjectId, value);
    res.status(200).json(updatedSubject);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
};
const hardDeleteSubject = async (req, res) => {
  try {
    const deletedSubject = await hardDeleteOneSubject(req.params.subjectId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const softDeleteSubject = async (req, res) => {
  try {
    const deletedSubject = await softDeleteOneSubject(req.params.subjectId);
    // Se actualiza el estudiante para que aparezca con active: false
    res.status(200).json(deletedSubject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
export {
  getSubjects,
  createSubject,
  createSubjects,
  createStudentsInSubject,
  deleteStudentsFromSubject,
  updateSubjectInfo,
  hardDeleteSubject,
  softDeleteSubject
};
