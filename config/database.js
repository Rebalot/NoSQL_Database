import mongoose from "mongoose";
import colors from "colors";
import config from "./config.js";

// Habilitar el modo de depuración y permitir consultas más flexibles
mongoose.set("debug", true);
mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState) {
      console.log("Connection already established".yellow.bold);
      return;
    }
    await mongoose.connect(config.dbUri);
    console.log("MongoDB connected...".green.bold);
  } catch (error) {
    console.error(error.message.red.bold);
    process.exit(1);
  }
};

export default connectDB;
