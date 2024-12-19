import Subjects from "../models/Subjects.js";

const validateSubjects = async (subjects) => {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error("At least one subject must be provided.");
  }

  const validations = subjects.map(subjectData => validateSubjectId(subjectData.subject_id));

  await Promise.all(validations);
};
const validateSubjectId = async (subjectId) => {
  const subject = await Subjects.findById(subjectId);
  if (!subject) {
    throw new Error(`Subject with ID ${subjectId} doesn't exist`);
  }
  return subject;
};

export {
  validateSubjects,
  validateSubjectId
};
