import express from "express";
import cors from "cors";
import "dotenv/config";
import notesRouter from "./routes/notesRouter.js";
import session from "express-session";
import passport from "passport";
import "./strategy/supabase.js";
import userRouter from "./routes/userRouter.js";
const app = express();

const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

// Configure CORS for production and development
const allowedOrigins = isProduction
  ? [
      process.env.PRODUCTION_FRONTEND_URL,
      "https://mycloudnotes.netlify.app",
    ].filter(Boolean)
  : [
      "http://localhost:5173",
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// session middleware , it shall always before endpoints
app.use(
  session({
    secret: process.env.SESSION_SECRET || (isProduction ? null : "mysecret"),
    resave: false,
    saveUninitialized: false, // Changed to false for security
    name: "notesapp.sid", // Custom session name
    // For cross-site cookies with a frontend on another origin
    cookie: {
      secure: isProduction, // requires HTTPS in production
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(express.json());
// If behind a proxy (Render/Heroku), enable to set secure cookies
app.set("trust proxy", 1);
app.use(passport.initialize());
app.use(passport.session()); // attaches user obj to req if logged in

// Health check endpoint for production monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({
    session: req.session,
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api", notesRouter);
app.use("/api", userRouter);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
