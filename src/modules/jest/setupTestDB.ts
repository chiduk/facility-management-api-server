import mongoose from 'mongoose';
import config from '../../config/config';
import radish from '../radish';

const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoose.url);
    radish.connectRadish();
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};

export default setupTestDB;
