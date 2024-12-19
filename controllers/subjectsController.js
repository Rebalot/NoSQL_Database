import { queryActive, queryNumbersArray, queryStringsArray } from "../helpers/queryHelper.js";
import Joi from "joi";
import Subjects from "../models/Subjects.js";

const subjectsSchema = Joi.object({
  subject: Joi.string().pattern(/^[a-zA-ZÀ-ÿ]+(?:\s[a-zA-ZÀ-ÿ]+)*$/).required(),
  students_id: Joi.array().items(
    Joi.string().length(24).pattern(/^[a-z0-9]+$/).required()
  )
});
const getSubjects = async (req, res) => {
  try {
    const query = {};

    query.active = queryActive(req.query.active);
    if (req.query._id) {
      query._id = { $in: queryStringsArray(req.query._id) };
    }
    if (req.query.subject) {
      query.subject = { $in: queryStringsArray(req.query.subject) };
    }
    if (req.query.students_id) {
      query.students_id = { $in: req.query.students_id };
    }
    const subjects = await Subjects.find(query);
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
    const { error, value } = subjectsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const subject = await Subjects.create(value);
    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
const createSubjects = async (req, res) => {
  try {
    const schema = Joi.array().items(subjectsSchema).required();
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const subjects = await Subjects.insertMany(value);
    res.status(201).json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};
// const updateSubject = async (req, res) => {
//   try {
//     const updateSubjectsSchema = subjectsSchema.fork(["subject"], field => field.optional());
//     const { error, value } = updateSubjectsSchema.validate(req.body);
//     console.log(value);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }
//     const updatedSubjects = await updateSubjectWithStudent(req.params.id, value);
//     res.status(200).json(updatedSubjects);
//   } catch (err) {
//     console.error(err.message);
//     res.status(400).json({ error: err.message });
//   }
// };
export {
  getSubjects,
  createSubject,
  createSubjects
  // updateSubject
};
