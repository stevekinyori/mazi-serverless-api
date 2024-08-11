import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDbClient = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async () => {
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const response = await dynamoDbClient.send(command);

    if (!response.Items) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'No devices found' }),
        };
    }

    const items = response.Items.map(item => unmarshall(item));
    
    const totalDevices = items.length;
    const activeDevices = items.filter(item => item.status === 'active').length;
    const lowBatteryDevices = items.filter(item => item.batteryLevel < 40).length;
    const redZoneDevices = items.filter(item => item.batteryLevel < 20 && item.status === 'inactive').length;
    const highTempDevices = items.filter(item => item.temperature > 45).length;
    const highSpeedDevices = items.filter(item => item.speed > 80).length;

    const batteryHealthGrouping = items.reduce((acc, item) => {
        const status = item.batteryHealthStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const summary = {
        totalDevices,
        activeDevices,
        lowBatteryDevices,
        redZoneDevices,
        highTempDevices,
        highSpeedDevices,
        batteryHealthGrouping,
    };

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: JSON.stringify(summary),
    };
};
