// eslint-disable-next-line import/no-extraneous-dependencies
import { InvokeCommand, LambdaClient, LogType } from '@aws-sdk/client-lambda';
import config from '../../config/config';

const client = new LambdaClient({ credentials: config.snsPublisher.credentials, region: config.snsPublisher.region });

export const JsonToUint8Array = (json: object): Uint8Array => {
  const jsonStr = JSON.stringify(json, null, 0);
  const array = new Uint8Array(jsonStr.length);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < jsonStr.length; i++) {
    array[i] = jsonStr.charCodeAt(i);
  }
  return array;
};

export const sendVerificationCode = async (params: object) => {
  const paramsBuffer = JsonToUint8Array(params);
  const command = new InvokeCommand({
    FunctionName: config.snsPublisher.functionName,
    Payload: paramsBuffer,
    LogType: LogType.Tail,
  });
  const result = await client.send(command);
  return result;
};
