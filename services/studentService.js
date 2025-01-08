import {
  queryActive,
  queryNumbersArray,
  queryStringsArray
} from "../helpers/queryHelper.js";
import Students from "../models/Students.js";
import mongoose from "mongoose";
import {
  deleteStudentFromAllSubjects,
  deleteStudentsFromSubject,
  insertStudentInSubject,
  insertStudentInSubjects,
  validateStudentInSubject,
  validateSubjectId,
  validateSubjectIds
} from "./subjectService.js";

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
  if (
    reqQuery.subjects ||
    reqQuery.grade_max ||
    reqQuery.grade_min ||
    reqQuery.grade
  ) {
    const elemMatchConditions = {};
    if (reqQuery.subjects) {
      const subjectIds = queryStringsArray(reqQuery.subjects);
      elemMatchConditions.subject_id = { $in: subjectIds };
    }
    if (reqQuery.grade_min) {
      const gradeNumber = +reqQuery.grade_min;
      elemMatchConditions.grade = {
        ...elemMatchConditions.grade,
        $gte: gradeNumber
      };
    }
    if (reqQuery.grade_max) {
      const gradeNumber = +reqQuery.grade_max;
      elemMatchConditions.grade = {
        ...elemMatchConditions.grade,
        $lte: gradeNumber
      };
    }
    if (reqQuery.grade) {
      const gradeNumber = +reqQuery.grade;
      elemMatchConditions.grade = {
        ...elemMatchConditions.grade,
        $eq: gradeNumber
      };
    }
    query.subjects = { $elemMatch: elemMatchConditions };
  }

  const students = await Students.find(query);
  students.sort((a, b) => a.studentId - b.studentId);
  return students;
};
const createOneStudent = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const student = await Students.create([data], { session });
    if (student[0].subjects && student[0].subjects.length > 0) {
      await validateSubjectIds(student[0].subjects);

      await insertStudentInSubjects(student[0], session);
    }
    await session.commitTransaction();
    session.endSession();
    return student[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const createManyStudents = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const students = await Students.insertMany(data, { session });

    for (const studentData of students) {
      if (studentData.subjects && studentData.subjects.length > 0) {
        await validateSubjectIds(studentData.subjects);

        await insertStudentInSubjects(studentData, session);
      }
    }
    await session.commitTransaction();
    session.endSession();
    return students;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const updateOneStudentInfo = async (studentId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // studentId es el _id del Student en request.params
    const student = await validateStudentId(studentId);
    const updateQuery = {};
    // updateData.studentId es la matricula asignada por la institución
    if (updateData.studentId) updateQuery.studentId = updateData.studentId;
    if (updateData.name) updateQuery.name = updateData.name;
    if (updateData.lastName) updateQuery.lastName = updateData.lastName;
    if (updateData.birthDate) updateQuery.birthDate = updateData.birthDate;
    if (updateData.group) updateQuery.group = updateData.group;
    if (updateData.active) updateQuery.active = updateData.active;
    console.log(studentId);
    const updatedStudent = await Students.findByIdAndUpdate(
      studentId,
      updateQuery,
      { session, new: true, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();
    return updatedStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const hardDeleteOneStudent = async (studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deletedStudent = await Students.findByIdAndDelete(
      studentId,
      { session }
    );
    if (!deletedStudent) {
      throw new Error(`Student with ID ${studentId} doesn't exist`);
    }
    if (deletedStudent.subjects && deletedStudent.subjects.length > 0) {
      await deleteStudentFromAllSubjects(studentId, session);
    }

    await session.commitTransaction();
    session.endSession();
    return deletedStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const softDeleteOneStudent = async (studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const student = await validateStudentId(studentId);

    if (student.subjects && student.subjects.length > 0) {
      await deleteStudentFromAllSubjects(studentId, session);
      await deleteAllSubjectsFromStudent(studentId, session);
    }
    const updatedStudent = await Students.findByIdAndUpdate(
      studentId,
      { active: false },
      { session, new: true, runValidators: true }
    );
    await session.commitTransaction();
    session.endSession();
    return updatedStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const addSubjectInStudent = async (studentId, subjectData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Se valida que el Student exista en los Students
    const student = await validateStudentId(studentId);
    // Se valida que el Subject exista en los Subjects
    const subject = await validateSubjectId(subjectData.subject_id);
    // Se valida que el Subject no exista en los Subjects del Student, si ya existe se lanza un error
    const existingSubjectInStudent = await validateSubjectInStudent(
      student,
      subjectData.subject_id
    );
    // Se valida que el Student no exista en los Students del Subject, si ya existe se lanza un error
    const existingStudentInSubject = await validateStudentInSubject(
      subject,
      studentId
    );

    // Si las validaciones pasan, se inserta el Subject en el Student y el Student en el Subject
    const updatedStudent = await insertSubjectInStudent(
      studentId,
      subjectData,
      session
    );
    const updatedSubject = await insertStudentInSubject(
      subjectData.subject_id,
      studentId,
      session
    );

    await session.commitTransaction();
    session.endSession();
    return updatedStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const removeSubjectFromStudent = async (studentId, subjectId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Se valida que el Student exista en los Students
    const student = await validateStudentId(studentId);
    const existingSubjectInStudent = await validateSubjectInStudent(student, subjectId, false);
    const updatedStudent = await deleteSubjectFromStudent(studentId, subjectId, session);
    const updatedSubject = await deleteStudentsFromSubject(subjectId, studentId, session);

    await session.commitTransaction();
    session.endSession();
    return updatedStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const updateGradeInStudent = async (studentId, subjectData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const student = await validateStudentId(studentId);
    const subject = await validateSubjectId(subjectData.subject_id);
    const existingSubjectInStudent = await validateSubjectInStudent(
      student,
      subjectData.subject_id,
      false
    );

    const updatedStudent = await Students.findOneAndUpdate(
      { _id: studentId, "subjects.subject_id": subjectData.subject_id },
      {
        $set: {
          "subjects.$.grade": subjectData.grade
        }
      },
      { session, new: true, runValidators: true }
    );
    await session.commitTransaction();
    session.endSession();
    return updatedStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const validateStudentIds = async (studentIds) => {
  // Recibe un array de IDs de estudiantes y valida que existan en la base de datos
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new Error("At least one student must be provided.");
  }

  const foundStudents = await Students.find({ _id: { $in: studentIds } });

  if (foundStudents.length !== studentIds.length) {
    const foundIds = foundStudents.map((student) => student._id.toString());

    // Se filtran los IDs que no están incluidos en el array de foundIds
    const missingIds = studentIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Students with IDs ${missingIds.join(", ")} do not exist.`);
  }
  return foundStudents;
};
const validateStudentId = async (studentId) => {
  const student = await Students.findById(studentId);
  if (!student) {
    throw new Error(`Student with ID ${studentId} doesn't exist`);
  }
  return student;
};
const validateSubjectInStudent = (student, subjectId, ifExist = true) => {
  // Retorna el primer subject en el array de subjects del student que coincida con el subjectId
  const existingSubject = student.subjects.find(
    (subj) => subj.subject_id.toString() === subjectId.toString()
  );
  if (ifExist && existingSubject) {
    throw new Error(
      `Subject with ID ${subjectId} already exist in student's subjects.`
    );
  }
  if (!ifExist && !existingSubject) {
    throw new Error(
      `Subject with ID ${subjectId} doesn't exist in student's subjects.`
    );
  }
  return existingSubject;
};
const insertSubjectInStudents = async (subjectData, session) => {
  // Devuelve un objeto con matchedCount y modifiedCount
  const updatedStudents = Students.updateMany(
    { _id: { $in: subjectData.students_id } },
    {
      $push: {
        subjects: {
          subject_id: subjectData._id
        }
      }
    },
    { session, runValidators: true }
  );
  return updatedStudents;
};
const insertSubjectInStudent = async (studentId, subjectData, session) => {
  const updatedStudent = await Students.findByIdAndUpdate(
    studentId,
    {
      $push: {
        subjects: {
          subject_id: subjectData.subject_id,
          grade: subjectData.grade
        }
      }
    },
    { session, new: true, runValidators: true }
  );
  return updatedStudent;
};
const deleteSubjectFromStudent = async (studentId, subjectId, session) => {
  // Para un único subject de un único student
  const updatedStudent = Students.findByIdAndUpdate(
    studentId,
    { $pull: { subjects: { subject_id: subjectId } } },
    { session, new: true, runValidators: true }
  );
  return updatedStudent;
};
const deleteAllSubjectsFromStudent = async (studentId, session) => {
  // Para todos los subjects de un único student
  const updatedStudent = Students.findByIdAndUpdate(
    studentId,
    { $set: { subjects: [] } },
    { session, new: true, runValidators: true }
  );
  return updatedStudent;
};
const deleteSubjectFromAllStudents = async (subjectId, session) => {
  // Para un único subject de todos los students
  // Devuelve un objeto con matchedCount y modifiedCount
  const updatedStudents = Students.updateMany(
    { subjects: { $elemMatch: { subject_id: subjectId } } },
    { $pull: { subjects: { subject_id: subjectId } } },
    { session, runValidators: true }
  );
  return updatedStudents;
};
const deleteSubjectFromStudents = async (studentIds, subjectId, session) => {
  // Para un único subject de un array de students
  // Devuelve un objeto con matchedCount y modifiedCount
  const updatedStudents = Students.updateMany(
    { _id: { $in: studentIds } },
    { $pull: { subjects: { subject_id: subjectId } } },
    { session, runValidators: true }
  );
  return updatedStudents;
};

export {
  findStudents,
  createOneStudent,
  createManyStudents,
  updateOneStudentInfo,
  softDeleteOneStudent,
  hardDeleteOneStudent,
  addSubjectInStudent,
  removeSubjectFromStudent,
  updateGradeInStudent,
  validateStudentIds,
  validateStudentId,
  validateSubjectInStudent,
  insertSubjectInStudents,
  insertSubjectInStudent,
  deleteSubjectFromStudent,
  deleteAllSubjectsFromStudent,
  deleteSubjectFromAllStudents,
  deleteSubjectFromStudents
};
