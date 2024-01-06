import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

export async function handler(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // create AWS SDK clients
  const dynamo = new DynamoDB();
  const lambda = new LambdaClient();

  // update dynamo entry for "path" with hits++
  await dynamo.updateItem({
    TableName: process.env.HITS_TABLE_NAME,
    Key: { path: { S: event.path } },
    UpdateExpression: "ADD hits :incr",
    ExpressionAttributeValues: { ":incr": { N: "1" } },
  });

  const input = {
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: JSON.stringify(event),
  };
  const command = new InvokeCommand(input);
  // call downstream function and capture response
  const resp = await lambda.send(command);

  console.log("downstream response:", JSON.stringify(resp, undefined, 2));
  // return response back to upstream caller
  return JSON.parse(Buffer.from(resp.Payload).toString());
}
