import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors());

// Parse incoming request JSON bodies
app.use(express.json());

// Root Path Welcome Handler
app.get("/", (req, res) => {
  res.send("🚀 SIWES API Server is running successfully!");
});

// Mount central router
app.use("/api", routes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "An internal server error occurred" });
});

// Start the server if this file is run directly (not in tests)
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 SIWES API Server running on http://localhost:${PORT}`);
  });
}

export default app;
