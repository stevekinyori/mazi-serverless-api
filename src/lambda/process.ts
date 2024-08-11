import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import { SQSHandler } from 'aws-lambda';

const dynamoDbClient = new DynamoDBClient({});

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    if (Array.isArray(body)) {
      for (const element of body) {
        await storeData(element);
      }
    } else {
      await storeData(body);
    }
  }
};

async function storeData(data: any) {
  const params: PutItemCommandInput = {
    TableName: process.env.TABLE_NAME!,
    Item: {
      deviceId: { S: data.deviceId },
      timestamp: { S: data.timestamp },
      batteryLevel: { N: data.batteryLevel.toString() },
      location: {
        M: {
          latitude: { N: data.location.latitude.toString() },
          longitude: { N: data.location.longitude.toString() }
        }
      },
      speed: { N: data.speed.toString() },
      temperature: { N: data.temperature.toString() },
      status: { S: data.status },
      batteryHealthStatus: { S: data.batteryHealthStatus }
    }
  };

  try {
    await dynamoDbClient.send(new PutItemCommand(params));
    console.log(`Successfully stored data for deviceId: ${data.deviceId}`);
  } catch (error) {
    console.error(`Error storing data for deviceId: ${data.deviceId}`, error);
  }
}
