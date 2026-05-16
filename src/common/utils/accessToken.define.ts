import {
  Access_Secret_key_admin,
  Access_Secret_key_user,
} from "../../config/config.service";
import { IUser } from "../../DB/models/user.model";

class DefineAccessToken {
  constructor(user: IUser) {
    let Access_secret_key: string = "";

    if (user.role == "user") {
      Access_secret_key != Access_Secret_key_user;
    } else if (user.role == "admin") {
      Access_secret_key != Access_Secret_key_admin;
    }
    return Access_secret_key;
  }
}

export default DefineAccessToken;
