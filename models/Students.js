import mongoose from "mongoose";

const studentsSchema = new mongoose.Schema({
  studentId: { type: Number, required: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  group: { type: String, default: "N/A" },
  subjects: [{
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subjects" },
    grade: { type: mongoose.Schema.Types.Mixed, default: "N/A" }
  }],
  active: { type: Boolean, default: true }
},
{ timestamps: true }
);
const Students = mongoose.model("Students", studentsSchema);
export default Students;
