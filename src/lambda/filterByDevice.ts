import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

const dynamoDbClient = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const deviceId = event.pathParameters?.deviceId;

  if (!deviceId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "deviceId is required" }),
    };
  }

  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "deviceId = :deviceId",
    ExpressionAttributeValues: {
      ":deviceId": { S: deviceId },
    },
  };

  try {
    const data = await dynamoDbClient.send(new QueryCommand(params));
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
      body: JSON.stringify(data.Items?.map(item => unmarshall(item)) || []),
    };
  } catch (error) {
    console.error("Error querying DynamoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to query DynamoDB" }),
    };
  }
};
