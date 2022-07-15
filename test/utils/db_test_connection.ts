import { v4 as uuidv4 } from 'uuid';
import EnvVariablesSingleton from '../../src/setup/EnvVariablesSingleton';
import mongoose from 'mongoose';

export async function createConnectionToTestDB() {
  await mongoose.connect(EnvVariablesSingleton.instance.dbAddress + uuidv4());
}

export async function dropConnectedTestDB() {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
}
