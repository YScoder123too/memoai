import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  // Structured app data: tasks, sessions, mastery, doubts (with review schedule), chat, goal, exam.
  state: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, collection: "memoai_users" }); // own collection name, so a shared database cannot clash with other projects

export const User = mongoose.models.User || mongoose.model("User", userSchema);
