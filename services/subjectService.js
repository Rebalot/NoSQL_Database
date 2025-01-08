import mongoose from "mongoose";
import { queryActive, queryStringsArray } from "../helpers/queryHelper.js";
import Subjects from "../models/Subjects.js";
import { deleteSubjectFromAllStudents, deleteSubjectFromStudents, insertSubjectInStudents, validateStudentIds, validateSubjectInStudent } from "./studentService.js";

const findSubjects = async (reqQuery) => {
  const query = {};

  query.active = queryActive(reqQuery.active);
  if (reqQuery._id) {
    query._id = { $in: queryStringsArray(reqQuery._id) };
  }
  if (reqQuery.subject) {
    query.subject = { $in: queryStringsArray(reqQuery.subject) };
  }
  if (reqQuery.students_id) {
    query.students_id = { $in: queryStringsArray(reqQuery.students_id) };
  }

  const subjects = await Subjects.find(query);
  return subjects;
};
const createOneSubject = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const subject = await Subjects.create([data], { session });
    if (subject[0].students_id && subject[0].students_id.length > 0) {
      await validateStudentIds(subject[0].students_id);

      await insertSubjectInStudents(subject[0], session);
    }
    await session.commitTransaction();
    session.endSession();
    return subject[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const createManySubjects = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const subjects = await Subjects.insertMany(data, { session });

    for (const subjectData of subjects) {
      if (subjectData.students_id && subjectData.students_id.length > 0) {
        await validateStudentIds(subjectData.students_id);

        await insertSubjectInStudents(subjectData, session);
      }
    }
    await session.commitTransaction();
    session.endSession();
    return subjects;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const updateOneSubjectInfo = async (subjectId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const subject = await validateSubjectId(subjectId);

    const updateQuery = {};
    if (updateData.subject) updateQuery.subject = updateData.subject;
    if (updateData.active) updateQuery.active = updateData.active;

    const updatedSubject = await Subjects.findByIdAndUpdate(
      subjectId,
      updateQuery,
      { session, new: true, runValidators: true }
    );

    await session.commitTransaction();
    session.endSession();
    return updatedSubject;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const hardDeleteOneSubject = async (subjectId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deletedSubject = await Subjects.findByIdAndDelete(
      subjectId,
      { session }
    );
    if (!deletedSubject) {
      throw new Error(`Subject with ID ${subjectId} doesn't exist`);
    }
    if (deletedSubject.students_id && deletedSubject.students_id.length > 0) {
      await deleteSubjectFromAllStudents(subjectId, session);
    }

    await session.commitTransaction();
    session.endSession();
    return deletedSubject;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const softDeleteOneSubject = async (subjectId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const subject = await validateSubjectId(subjectId);
    if (subject.students_id && subject.students_id.length > 0) {
      await deleteSubjectFromAllStudents(subjectId, session);
      await deleteAllStudentsFromSubject(subjectId, session);
    }
    const updatedSubject = await Subjects.findByIdAndUpdate(
      subjectId,
      { active: false },
      { session, new: true, runValidators: true }
    );
    await session.commitTransaction();
    session.endSession();
    return updatedSubject;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const addStudentsInSubject = async (subjectId, studentIds) => {
  // Se agregan uno o varios studentIds a un mismo subjectId (por medio de un array)
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Se valida que el Subject exista en los Subjects
    const subject = await validateSubjectId(subjectId);
    // Se valida que el Student exista en los Students
    const students = await validateStudentIds(studentIds);
    for (const student of students) {
      // Se valida que el Student no exista en los Students del Subject, si ya existe se lanza un error
      const existingStudentInSubject = await validateStudentInSubject(
        subject,
        student._id
      );
      // Se valida que el Subject no exista en los Subjects del Student, si ya existe se lanza un error
      const existingSubjectInStudent = await validateSubjectInStudent(
        student,
        subjectId
      );
    }
    // Si las validaciones pasan, se inserta el Subject en el Student y el Student en el Subject
    const updatedSubject = await insertStudentsInSubject(
      subjectId,
      studentIds,
      session
    );
    const updatedStudents = await insertSubjectInStudents(
      updatedSubject,
      session
    );

    await session.commitTransaction();
    session.endSession();
    return updatedSubject;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const removeStudentsFromSubject = async (subjectId, studentIds) => {
  // Se remueven uno o varios studentIds a un mismo subjectId (por medio de un array)
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Se valida que el Subject exista en los Subjects
    const subject = await validateSubjectId(subjectId);
    for (const studentId of studentIds) {
      const existingStudentInSubject = await validateStudentInSubject(subject, studentId, false);
    }

    const updatedSubject = await deleteStudentsFromSubject(subjectId, studentIds, session);
    const updatedStudents = await deleteSubjectFromStudents(studentIds, subjectId, session);
    await session.commitTransaction();
    session.endSession();
    return updatedSubject;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during transaction:", error);
    throw new Error("Transaction failed, all changes rolled back");
  }
};
const validateSubjectIds = async (subjects) => {
  // Recibe un array de subjects y valida que todos los subjects existan en la base de datos
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error("At least one subject must be provided.");
  }

  const subjectIds = subjects.map((subjectData) => subjectData.subject_id);
  const foundSubjects = await Subjects.find({ _id: { $in: subjectIds } });

  if (foundSubjects.length !== subjectIds.length) {
    const foundIds = foundSubjects.map((subject) => subject._id.toString());

    // Se filtran los IDs que no están incluidos en el array de foundIds
    const missingIds = subjectIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Subjects with IDs ${missingIds.join(", ")} do not exist.`);
  }
};
const validateSubjectId = async (subjectId) => {
  const subject = await Subjects.findById(subjectId);
  if (!subject) {
    throw new Error(`Subject with ID ${subjectId} doesn't exist`);
  }
  return subject;
};
const validateStudentInSubject = (subject, studentId, ifExist = true) => {
  // Retorna el primer student en el array de students_id del subject que coincida con el studentId
  const existingStudent = subject.students_id.find(
    (subj) => subj.toString() === studentId.toString()
  );
  if (ifExist && existingStudent) {
    throw new Error(
      `Student with ID ${studentId} already exist in subject's students.`
    );
  }
  if (!ifExist && !existingStudent) {
    throw new Error(
      `Student with ID ${studentId} doesn't exist in subject's students.`
    );
  }
  return existingStudent;
};
const insertStudentsInSubject = async (subjectId, studentIds, session) => {
  // Devuelve un objeto con matchedCount y modifiedCount
  const updatedSubject = Subjects.findByIdAndUpdate(
    subjectId,
    { $addToSet: { students_id: { $each: studentIds } } },
    { session, new: true, runValidators: true }
  );
  return updatedSubject;
};
const insertStudentInSubjects = async (studentData, session) => {
  // Devuelve un objeto con matchedCount y modifiedCount
  const subjectIds = studentData.subjects.map(
    (subjectData) => subjectData.subject_id
  );
  const updatedSubjects = Subjects.updateMany(
    { _id: { $in: subjectIds } },
    { $addToSet: { students_id: studentData._id } },
    { session, runValidators: true }
  );
  return updatedSubjects;
};
const insertStudentInSubject = async (subjectId, studentId, session) => {
  // addToSet agregará el studentId al array de students_id solo si no existe
  const updatedSubject = await Subjects.findByIdAndUpdate(
    subjectId,
    { $addToSet: { students_id: studentId } },
    { session, new: true, runValidators: true }
  );
  return updatedSubject;
};
const deleteStudentsFromSubject = async (subjectId, studentIds, session) => {
  // Para eliminar uno o varios studentIds de un mismo subjectId
  // Puede recibir un solo studentId o un array de studentIds
  if (!Array.isArray(studentIds)) {
    studentIds = [studentIds];
  }
  const updatedSubject = await Subjects.findByIdAndUpdate(
    subjectId,
    { $pull: { students_id: { $in: studentIds } } },
    { session, new: true, runValidators: true });
  return updatedSubject;
};
const deleteAllStudentsFromSubject = async (subjectId, session) => {
  // Para eliminar todos los studentIds de un mismo subjectId
  const updatedSubject = await Subjects.findByIdAndUpdate(
    subjectId,
    { $set: { students_id: [] } },
    { session, new: true, runValidators: true }
  );
  return updatedSubject;
};
const deleteStudentFromAllSubjects = async (studentId, session) => {
  // Para eliminar un studentId de todos los subjects
  // Devuelve un objeto con matchedCount y modifiedCount
  const updatedSubjects = Subjects.updateMany(
    { students_id: studentId },
    { $pull: { students_id: studentId } },
    { session, runValidators: true }
  );
  return updatedSubjects;
};

export {
  findSubjects,
  createOneSubject,
  createManySubjects,
  updateOneSubjectInfo,
  hardDeleteOneSubject,
  softDeleteOneSubject,
  addStudentsInSubject,
  removeStudentsFromSubject,
  validateSubjectIds,
  validateSubjectId,
  validateStudentInSubject,
  insertStudentInSubject,
  insertStudentsInSubject,
  insertStudentInSubjects,
  deleteStudentsFromSubject,
  deleteAllStudentsFromSubject,
  deleteStudentFromAllSubjects
};
