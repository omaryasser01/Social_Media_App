import mongoose, { Types } from "mongoose";
import { genderEnum, RoleEnum } from "../../common/enum/user.enum";

export interface IUser {
  _id: Types.ObjectId;
  fName: string;
  lName: string;
  userName: string;
  email: string;
  password: string;
  gender: genderEnum;
  role?: RoleEnum;
  age: number;
  phone?: string;
  address?: string;
  confirmed?: boolean;
  createdAt: Date;
  updaetdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fName: {
      type: String,
      required: true,
      trim: true,
      min: 5,
      max: 25,
    },
    lName: {
      type: String,
      required: true,
      trim: true,
      min: 5,
      max: 25,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      trim: true,
      required: true,
    },
    gender: {
      type: String,
      enum: genderEnum,
      required: true,
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.user,
    },
    phone: {
      type: String,
      trim: true,
    },
    confirmed: Boolean,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.fName + " " + this.lName;
  })
  .set(function (val: string) {
    this.set({ fName: val.split(" ")[0], lName: val.split(" ")[1] });
  });

const userModel =
  mongoose.models.user || mongoose.model<IUser>("user", userSchema);

export default userModel;
