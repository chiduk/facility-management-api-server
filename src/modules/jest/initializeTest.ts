import mongoose from 'mongoose';
import * as process from 'process';
import config from '../../config/config';
import radish from '../radish';
import emptyDir from '../utils/fs';

const initializeTest = () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoose.testUrl);
    await radish.connectRadish();
  });

  afterAll(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany({})));
    await mongoose.disconnect();
    await radish.disconnectRadish();
    await emptyDir(`${process.cwd()}/uploads_test`);
  });
};

export default initializeTest;
