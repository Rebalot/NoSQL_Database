import mongoose from "mongoose";

const subjectsSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  students_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "Students", required: true }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

const Subjects = mongoose.model("Subjects", subjectsSchema);
export default Subjects;
