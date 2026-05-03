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

abstract class BaseReposatory<Tdocument> {
  constructor(protected readonly model: Model<Tdocument>) {}

  async create(data: Partial<Tdocument>): Promise<Tdocument> {
    return this.model.create(data);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findById(id);
  }

  async findOne({
    filter,
    projection,
  }: {
    filter: QueryFilter<Tdocument>;
    projection?: ProjectionType<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOne(filter, projection);
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    projection?: ProjectionType<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument>[] | []> {
    return this.model
      .find(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .populate(options?.populate as PopulateOptions);
  }

  async findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: Types.ObjectId;
    update: UpdateQuery<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    update: UpdateQuery<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<Tdocument>;
    options?: QueryOptions<Tdocument>;
  }): Promise<HydratedDocument<Tdocument> | null> {
    return this.model.findOneAndDelete(filter, { new: true, ...options });
  }
}

export default BaseReposatory;
