import mongoose from "mongoose";
import { config } from "./config.js";
import { createApp } from "./app.js";

if (!config.jwt || config.jwt === "change-me") { console.error("Set a strong JWT_SECRET in server/.env"); process.exit(1); }
if (!config.mongo) { console.error("Set MONGODB_URI in server/.env"); process.exit(1); }

await mongoose.connect(config.mongo);
console.log("MongoDB connected");
createApp().listen(config.port, () => console.log(`MemoAI API on http://localhost:${config.port}`));
