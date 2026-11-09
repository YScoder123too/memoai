import "dotenv/config";
export const config = {
  port: process.env.PORT || 5000,
  origins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()),
  mongo: process.env.MONGODB_URI || "",
  jwt: process.env.JWT_SECRET || "",
  groq: process.env.GROQ_API_KEY || "",
  gemini: process.env.GEMINI_API_KEY || "",
  qdrantUrl: (process.env.QDRANT_URL || "").replace(/\/$/, ""),
  qdrantKey: process.env.QDRANT_API_KEY || "",
};
