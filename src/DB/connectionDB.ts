import mongoose from "mongoose";
import { DB_URi_online, MogoURI } from "../config/config.service";

export const checkDBconnection = async () => {
  try {
    await mongoose.connect(DB_URi_online!);
    console.log("DB connected successfully");
  } catch (error) {
    console.log(error);
  }
};
