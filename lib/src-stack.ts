import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SrcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const s3Bucket = new cdk.aws_s3.Bucket(this, "gatewayAuthLambda", {
      bucketName: "cdk-api-auth-stack-medium",
    });

    const dynamo_table = new cdk.aws_dynamodb.Table(this, "dynamo_table", {
      tableName: "CdkAuthLambdaTest",
      partitionKey: { name: "elementId", type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    const processor_lamda = new cdk.aws_lambda.Function(
      this,
      "processor_lamda",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        timeout: Duration.seconds(30),
        code: cdk.aws_lambda.Code.fromAsset("lambda/lambda-processor/"),
        environment: {
          TABLE_NAME: dynamo_table.tableName,
          BUCKET_NAME: s3Bucket.bucketName
        },
      }
    );

    s3Bucket.grantPut(processor_lamda);
    dynamo_table.grantReadWriteData(processor_lamda);

    const authorizer_lamda = new cdk.aws_lambda.Function(
      this,
      "authorizer_lamda",
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        timeout: Duration.seconds(30),
        code: cdk.aws_lambda.Code.fromAsset("lambda/lambda-authorizer/"),
      }
    );

    //Create the token authorizer
    const token_authorizer = new cdk.aws_apigateway.TokenAuthorizer(this, 'token_authorizer', {
      handler: authorizer_lamda
    });

    //Creating the rest api
    const rest_api = new cdk.aws_apigateway.RestApi(this, "rest_api", {
      restApiName: "Processor Lambda API",
      description: "Processor Lambda API - Medium"
    });

    const cdk_resource = rest_api.root.addResource("process");

    const lambda_integration = new cdk.aws_apigateway.LambdaIntegration(
      processor_lamda
    );

    cdk_resource.addMethod("POST", lambda_integration, {
      authorizer: token_authorizer,
      authorizationType: cdk.aws_apigateway.AuthorizationType.CUSTOM,
    });

    const cdkUsagePlan = rest_api.addUsagePlan('cdkUsagePlan', {
      name: 'TestPlan',
      throttle: {
        rateLimit: 30,
        burstLimit: 1
      }
    });
    
    const cdkApiKey = rest_api.addApiKey('cdkApiKey');
    cdkUsagePlan.addApiKey(cdkApiKey);
  }
}
