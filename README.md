
---

## **Lambda Functions Documentation**

This project consists of several AWS Lambda functions integrated with DynamoDB, SQS, and API Gateway to manage real-time data from IoT devices. Below is an overview of each Lambda function, their purpose, and how they interact with other AWS services.

### **1. `PostLambda`**

- **Description:** This function handles POST requests to add new IoT device data to an SQS queue. It receives data from the API Gateway, validates it, and sends it to the SQS queue for further processing.

- **Handler:** `post.handler`

- **Environment Variables:**
  - `QUEUE_URL`: The URL of the SQS queue where the message will be sent.

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-sqs`): Used to send messages to the SQS queue.

- **Error Handling:**
  - The function checks for successful message delivery before returning a result.
  - Handles and logs errors if the message fails to send.

### **2. `ProcessLambda`**

- **Description:** This function processes messages from the SQS queue in batches. It reads the messages from the queue, parses the data, and stores it in the DynamoDB table.

- **Handler:** `process.handler`

- **Environment Variables:**
  - `TABLE_NAME`: The name of the DynamoDB table where the data will be stored.

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-dynamodb`): Used to write data to the DynamoDB table.
  - AWS Lambda Event Sources (`aws-cdk-lib/aws-lambda-event-sources`): Used to trigger the function from SQS events.

- **Error Handling:**
  - The function ensures each message is processed and stored successfully.
  - Handles errors during the write process and logs failures.

### **3. `GetLambda`**

- **Description:** This function handles GET requests to retrieve all items from the DynamoDB table. The results are ordered by timestamp.

- **Handler:** `get.handler`

- **Environment Variables:**
  - `TABLE_NAME`: The name of the DynamoDB table from which the data is retrieved.

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-dynamodb`): Used to scan and retrieve data from the DynamoDB table.

- **Error Handling:**
  - The function checks for successful data retrieval and returns the data.
  - Handles errors if data retrieval fails and logs the errors.

### **4. `SummaryLambda`**

- **Description:** This function provides a summary of the device data, such as the number of registered devices, active devices, devices with low battery, etc.

- **Handler:** `summary.handler`

- **Environment Variables:**
  - `TABLE_NAME`: The name of the DynamoDB table from which the summary data is retrieved.

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-dynamodb`): Used to query and aggregate data from DynamoDB.

- **Error Handling:**
  - Ensures correct data aggregation and handles errors during data processing.

### **5. `FilterByDeviceLambda`**

- **Description:** This function retrieves data filtered by a specific `deviceId` from the DynamoDB table. It’s triggered by a GET request with a `deviceId` parameter.

- **Handler:** `filterByDevice.handler`

- **Environment Variables:**
  - `TABLE_NAME`: The name of the DynamoDB table from which the data is retrieved.
  - `INDEX_NAME`: The name of the DynamoDB Global Secondary Index (GSI) for querying by `deviceId`.

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-dynamodb`): Used to query data from DynamoDB using the `deviceId` GSI.

- **Error Handling:**
  - The function handles cases where no data is found for a given `deviceId`.
  - Logs errors if the query fails.

### **6. `DynamoStreamHandler`**

- **Description:** This function processes DynamoDB stream events to send real-time updates via WebSocket to connected clients. It’s triggered by changes in the DynamoDB table.

- **Handler:** `dynamoStream.handler`

- **Environment Variables:**
  - `TABLE_NAME`: The name of the DynamoDB table whose stream is being processed.
  - `API_GATEWAY_ENDPOINT`: The endpoint of the WebSocket API to send updates to.

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-dynamodb`): Used to read stream events.
  - AWS SDK (`@aws-sdk/client-apigatewaymanagementapi`): Used to send messages to the WebSocket clients.

- **Error Handling:**
  - The function handles cases where a client disconnects and fails to receive messages.
  - Logs any errors during the WebSocket message sending process.

### **7. `ConnectHandler` & `DisconnectHandler`**

- **Description:** These functions handle the WebSocket connection lifecycle, managing client connections and disconnections.

- **Handler:**
  - `connect.handler`: For handling WebSocket connections.
  - `disconnect.handler`: For handling WebSocket disconnections.

- **Environment Variables:**
  - None

- **Dependencies:**
  - AWS SDK (`@aws-sdk/client-apigatewaymanagementapi`): Used to manage WebSocket connections.

- **Error Handling:**
  - Logs connection and disconnection events for monitoring purposes.

---

### **How to Deploy**

1. **Ensure AWS CDK is Installed:**
   - Run `npm install -g aws-cdk` if AWS CDK is not installed.

2. **Bootstrap Your Environment (if not done already):**
   ```bash
   cdk bootstrap
   ```

3. **Deploy the Stack:**
   ```bash
   cdk deploy
   ```

4. **Cleanup:**
   - To delete the stack, run:
   ```bash
   cdk destroy
   ```

### **Testing**

- **API Gateway:** Test your API Gateway endpoints using tools like Postman.
- **WebSocket:** Test WebSocket connections using tools like wscat.
- **Logs:** Monitor Lambda function logs in AWS CloudWatch for debugging and insights.

### **Contributing**

- **Reporting Issues:** If you encounter any issues, please open an issue on the repository.
- **Contributing Code:** Feel free to submit pull requests. Ensure your code adheres to the style guide and includes tests.

### **License**

This project is licensed under the MIT License.
