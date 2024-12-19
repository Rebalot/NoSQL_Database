import { queryActive, queryNumbersArray, queryStringsArray } from "../helpers/queryHelper.js";
import Students from "../models/Students.js";
import { validateSubjectId, validateSubjects } from "./subjectService.js";

const findStudents = async (reqQuery) => {
  const query = {};

  query.active = queryActive(reqQuery.active);
  if (reqQuery._id) {
    query._id = { $in: queryStringsArray(reqQuery._id) };
  }
  if (reqQuery.studentId) {
    query.studentId = { $in: queryNumbersArray(reqQuery.studentId) };
  }
  if (reqQuery.name) {
    query.name = new RegExp(reqQuery.name, "i");
  }
  if (reqQuery.lastName) {
    query.lastName = new RegExp(reqQuery.lastName, "i");
  }
  if (reqQuery.group) {
    query.group = { $in: queryStringsArray(reqQuery.group) };
  }
  if (reqQuery.subjects || reqQuery.grade_max || reqQuery.grade_min || reqQuery.grade) {
    const elemMatchConditions = {};
    if (reqQuery.subjects) {
      const subjectIds = queryStringsArray(reqQuery.subjects);
      elemMatchConditions.subject_id = { $in: subjectIds };
    }
    if (reqQuery.grade_min) {
      const gradeNumber = +reqQuery.grade_min;
      elemMatchConditions.grade = { ...elemMatchConditions.grade, $gte: gradeNumber };
    }
    if (reqQuery.grade_max) {
      const gradeNumber = +reqQuery.grade_max;
      elemMatchConditions.grade = { ...elemMatchConditions.grade, $lte: gradeNumber };
    }
    if (reqQuery.grade) {
      const gradeNumber = +reqQuery.grade;
      elemMatchConditions.grade = { ...elemMatchConditions.grade, $eq: gradeNumber };
    }
    query.subjects = { $elemMatch: elemMatchConditions };
  }

  const students = await Students.find(query);
  return students;
};

const createOneStudent = async (data) => {
  if (data.subjects) {
    await validateSubjects(data.subjects);
  }
  const student = await Students.create(data);
  return student;
};
const createManyStudents = async (data) => {
  for (const studentData of data) {
    if (studentData.subjects) {
      await validateSubjects(studentData.subjects);
    }
  }
  const students = await Students.insertMany(data);
  return students;
};
const updateStudentWithSubject = async (studentId, updateData) => {
  const student = await Students.findById(studentId);
  if (!student) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }
  const updateQuery = {};
  if (updateData.name) updateQuery.name = updateData.name;
  if (updateData.lastName) updateQuery.lastName = updateData.lastName;
  if (updateData.group) updateQuery.group = updateData.group;
  if (updateData.active !== undefined) updateQuery.active = updateData.active;
  if (updateData.subjects) {
    for (const subjectData of updateData.subjects) {
      const subject = await validateSubjectId(subjectData.subject_id);

      const existingSubjectIndex = student.subjects.findIndex(
        (subj) => subj.subject_id.toString() === subjectData.subject_id
      );
      if (existingSubjectIndex !== -1) {
        if (!subjectData.grade) {
          const error = new Error(
            `Subject with ID ${subjectData.subject_id} already added. A grade must be provided.`
          );
          error.status = 400;
          throw error;
        }
        updateQuery.$set = {
          [`subjects.${existingSubjectIndex}.grade`]: subjectData.grade
        };
      } else {
        updateQuery.$push = {
          subjects: { subject_id: subject._id, grade: subjectData.grade }
        };
      }
      // Agregar en la materia el objectId del estudiante si no se encuentra
      if (!subject.students_id.includes(student._id)) {
        subject.students_id.push(student._id);
        await subject.save();
      }
    }
  }

  const updatedStudent = await Students.findByIdAndUpdate(
    studentId,
    updateQuery,
    { new: true, runValidators: true }
  );
  return updatedStudent;
};
const deleteOneStudent = async (studentId) => {
  const deletedStudent = Students.findByIdAndDelete(studentId, { new: true })
  return deletedStudent;
};
export {
  findStudents,
  createOneStudent,
  createManyStudents,
  updateStudentWithSubject,
  deleteOneStudent
};
