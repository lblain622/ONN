const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const cardRoutes = require("./routes/cards");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//app.use("/api/cards", cardRoutes);

module.exports = app;
