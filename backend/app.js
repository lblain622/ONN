import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import errorHandler from "./middleware/handlers.js";
import authRoutes from "./routes/auth.js";
import deckRoutes from "./routes/decks.js";
import cardRoutes from "./routes/cards.js";
import matchRoutes from "./routes/matches.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));
app.use("/auth", authRoutes);
app.use("/decks", deckRoutes);
app.use("/cards", cardRoutes);
app.use("/matches", matchRoutes);
app.use(errorHandler);

export default app;
