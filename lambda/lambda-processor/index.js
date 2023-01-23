import { config, DynamoDB, S3 } from 'aws-sdk';
import { v5 as uuid } from 'uuid';
import { readFileSync, writeFileSync } from 'fs';
import { stringify } from 'csv-stringify/sync';
config.update({ region: 'ap-southeast-2' });

var dynamo = new DynamoDB();
const s3 = new S3();

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

export async function handler (event) {
  try {
    const uploadObjectId = generateDataAndUploadToS3();
    const eventBody = JSON.parse(event["body"]);
    const objectId = eventBody["objectId"];
    console.log("object ", objectId);
    var params = {
      TableName: TABLE_NAME,
      Item: {
        objectId: { S: objectId },
        reportFileName: { S: uploadObjectId },
      },
    };

    // Call dynamo DB to add the item to the table
    await dynamo.putItem(params).promise();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "success",
        objectId: objectId,
        elementId: uploadObjectId,
      }),
    };
  } catch (error) {
    throw Error(`Error in backend: ${error}`);
  }
}

const generateDataAndUploadToS3 = () => {
  var filePath = "/tmp/data.csv";
  const elementId = `${uuid()}.csv`;
  //Write data as CSV format
  writeCSVDataToFileAndUpload(filePath, elementId);
  return elementId;
};

function generateCSVData() {
  return [
    ['Name', 'Age', 'Dob', 'Place'],
    ['Sam', '30', '28/01/2001', 'Denmark'],
    ['JK', '30', '28/01/2001', 'Austria'],
    ['Adi', '30', '28/01/2001', 'Finland'],
    ['Jen', '30', '28/01/2001', 'Denmark'],
    ['Kim', '30', '28/01/2001', 'UK']
  ];
}

const uploadToS3Bucket = (fileName , elementId) => {
  // Read data from the file
  const fileContent = readFileSync(fileName);

  //Set S3 parameters
  const params = {
    Bucket: BUCKET_NAME,
    Key: elementId,
    Body: fileContent,
  };

  // Uploading files to the S3 bucket
  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploading completed. ${data.Location}`);
  });
  return elementId;
};

function writeCSVDataToFileAndUpload(filePath, elementId) {
    var data = generateCSVData();
    var output = stringify(data);

    writeFileSync(filePath, output);

    //upload the data to S3Bucket
    uploadToS3Bucket(filePath, elementId);
}
