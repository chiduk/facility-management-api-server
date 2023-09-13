import { Types } from 'mongoose';

const toObjectId = (str: string): Types.ObjectId => new Types.ObjectId(str);

export default toObjectId;
