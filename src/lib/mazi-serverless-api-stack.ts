import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

export class MaziApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, "MazeDeviceDataQueue", {
      visibilityTimeout: cdk.Duration.seconds(120),
      retentionPeriod: cdk.Duration.days(4),
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

    const table = new dynamodb.Table(this, "MazeDeviceData", {
      partitionKey: { name: "deviceId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING }, 
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, 
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true, 
    });

    // Global Secondary Indexes (GSIs)
    table.addGlobalSecondaryIndex({
      indexName: "BatteryHealthIndex",
      partitionKey: { name: "batteryHealthStatus", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING }, 
      projectionType: dynamodb.ProjectionType.ALL, 
    });

    table.addGlobalSecondaryIndex({
      indexName: "StatusIndex",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING }, 
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "BatteryLevelIndex",
      partitionKey: { name: "batteryLevel", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "DeviceIdIndex",
      partitionKey: { name: "deviceId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const postLambda = new lambda.Function(this, "PostLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromAsset("dist/lambda"),
      handler: "post.handler",
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });
    queue.grantSendMessages(postLambda);

    const getLambda = new lambda.Function(this, "GetLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("dist/lambda"),
      handler: "get.handler",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadData(getLambda);

    const summaryLambda = new lambda.Function(this, "SummaryLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("dist/lambda"),
      handler: "summary.handler",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadData(summaryLambda);

    const filterByDeviceLambda = new lambda.Function(this, "FilterByDeviceLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("dist/lambda"),
      handler: "filterByDevice.handler",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadData(filterByDeviceLambda);

    const api = new apigateway.RestApi(this, "MaziApi", {
      restApiName: "Mazi Service",
      description: "Mazi Api service"
    });

    const postIntegration = new apigateway.LambdaIntegration(postLambda);
    api.root.addResource("messages").addMethod("POST", postIntegration);

    const getIntegration = new apigateway.LambdaIntegration(getLambda);
    api.root.addResource("items").addMethod("GET", getIntegration);

    const summaryIntegration = new apigateway.LambdaIntegration(summaryLambda);
    api.root.addResource("summary").addMethod("GET", summaryIntegration);

    const deviceResource = api.root.addResource("devices");
    const deviceIdResource = deviceResource.addResource("{deviceId}");
    const filterByDeviceIntegration = new apigateway.LambdaIntegration(filterByDeviceLambda);
    deviceIdResource.addMethod("GET", filterByDeviceIntegration);

    const processLambda = new lambda.Function(this, "ProcessLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("dist/lambda"),
      handler: "process.handler",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantWriteData(processLambda);
    processLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {
        batchSize: 10,
        maxConcurrency: 20,
        reportBatchItemFailures: true,
      })
    );
  }
}
