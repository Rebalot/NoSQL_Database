import express from "express";
import morgan from "morgan";
import config from "./config/config.js";
import connectDB from "./config/database.js";
import colors from "colors";
import errorHandler from "./middleware/error.js";
import studentsRoutes from "./routes/studentsRoutes.js";
import subjectsRoutes from "./routes/subjectsRoutes.js";

const app = express();
// registrar solicitudes HTTP en la consola
app.use(morgan("combined"));
// analizar el cuerpo de al solicitudes en formato JSON
app.use(express.json());
// analizar el cuerpo de las solicitudes con datos codificados en URL
app.use(express.urlencoded({ extended: true }));

// Middleware de manejo de errores
app.use(errorHandler);

// Routes
app.use("/api/v1", studentsRoutes);
app.use("/api/v1", subjectsRoutes);

connectDB().then(() => {
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`.rainbow);
  });
});
