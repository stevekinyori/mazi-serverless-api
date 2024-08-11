import { SQSClient, SendMessageCommand, SendMessageCommandInput, SendMessageCommandOutput } from "@aws-sdk/client-sqs";

const sqs = new SQSClient();

export const handler = async (event: any) => {
    let body: any;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        console.error('Invalid JSON in request body:', error);
        return createErrorResponse(400, 'Invalid request body. Must be valid JSON.');
    }

    const params: SendMessageCommandInput = {
        MessageBody: JSON.stringify(body),
        QueueUrl: process.env.QUEUE_URL!,
    };

    try {
        const result: SendMessageCommandOutput = await sqs.send(new SendMessageCommand(params));

        if (!result.MessageId) {
            throw new Error('MessageId missing from SQS response');
        }
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: JSON.stringify({
                message: 'Message sent to SQS successfully!',
                messageId: result.MessageId,
            }),
        };

    } catch (error) {
        console.error('Error sending message to SQS:', error);
        return createErrorResponse(500, 'Failed to send message to SQS');
    }
};

function createErrorResponse(statusCode: number, message: string) {
    return {
        statusCode: statusCode,
        body: JSON.stringify({ message }),
    };
}
