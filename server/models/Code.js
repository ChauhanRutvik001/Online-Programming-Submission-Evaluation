import mongoose from "mongoose";

const CodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  codeByLanguage: {
    java: {
      type: String,
      default: '', // Optional: Set default to empty string
    },
    python: {
      type: String,
      default: '', // Optional: Set default to empty string
    },
    cpp: {
      type: String,
      default: '', // Optional: Set default to empty string
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update the 'updatedAt' field on document update
CodeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Code = mongoose.model("Code", CodeSchema);

export default Code;
