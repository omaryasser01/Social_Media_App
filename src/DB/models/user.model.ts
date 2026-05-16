import mongoose, { Types } from "mongoose";
import {
  genderEnum,
  providerEnum,
  RoleEnum,
} from "../../common/enum/user.enum";
import { AppError } from "../../common/utils/global-error";

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
  deletedAt: Date;
  profilePic: string;
  provider: providerEnum;
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
      required: function (): boolean {
        return this.provider == providerEnum.System ? true : false;
      },
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      trim: true,
      required: function (): boolean {
        return this.provider == providerEnum.System ? true : false;
      },
      min: 18,
      max: 99,
    },
    gender: {
      type: String,
      enum: genderEnum,
      required: function (): boolean {
        return this.provider == providerEnum.System ? true : false;
      },
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.user,
    },
    provider: {
      type: String,
      enum: providerEnum,
      default: providerEnum.System,
    },
    phone: {
      type: String,
      trim: true,
    },
    confirmed: Boolean,
    deletedAt: Date,
    profilePic: String,
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

// userSchema.pre("validate", function () {
//   if (this.age < 20) {
//     throw new AppError("age wrong,prehook test");
//   }
// });

// userSchema.pre("findOne", function () {
//   console.log("==============pre find hook");
//   const { paranoid, ...rest } = this.getQuery();
//   if (paranoid == "false ") {
//     this.setQuery({ ...rest });
//   } else {
//     this.setQuery({ ...rest, deletedAt: { $exists: false } });
//   }
// });

const userModel =
  mongoose.models.user || mongoose.model<IUser>("user", userSchema);

export default userModel;
