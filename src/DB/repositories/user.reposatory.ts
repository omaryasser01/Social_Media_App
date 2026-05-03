import {
  HydratedDocument,
  Model,
  PopulateOption,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";
import userModel, { IUser } from "../models/user.model";
import BaseReposatory from "./base.reposatory";
import { AppError } from "../../common/utils/global-error";

class UserReposatory extends BaseReposatory<IUser> {
  constructor(protected readonly model: Model<IUser> = userModel) {
    super(model);
  }

  async checkEmail(email: string) {
    const emailExist = await this.model.findOne({ email });
    if (emailExist) {
      throw new AppError("email already exist", 409);
    }
  }
}

export default UserReposatory;
