import mongoose from "mongoose";
import { MogoURI } from "../config/config.service";

export const checkDBconnection = async () => {
  try {
    await mongoose.connect(MogoURI);
    console.log("DB connected successfully");
  } catch (error) {
    console.log(error);
  }
};
