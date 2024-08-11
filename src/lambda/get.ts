import { DynamoDBClient, ScanCommand, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoDbClient = new DynamoDBClient({});

export const handler = async () => {
    const params: ScanCommandInput = {
        TableName: process.env.TABLE_NAME!,
    };

    try {
        const data: ScanCommandOutput = await dynamoDbClient.send(new ScanCommand(params));

        if (!data.Items) {
            throw new Error('No items found in the DynamoDB table');
        }
        const items = data.Items.map(item => unmarshall(item));
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: JSON.stringify(items),
        };

    } catch (error) {
        console.error('Error getting data from DynamoDB:', error);
        return createErrorResponse(500, 'Failed to get data from DynamoDB');
    }
};

function createErrorResponse(statusCode: number, message: string) {
    return {
        statusCode: statusCode,
        body: JSON.stringify({ message }),
    };
}
