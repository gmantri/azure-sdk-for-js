/*
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the MIT Licence.
  
  **NOTE**: If you are using version 1.1.x or lower, then please use the link below:
  https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/servicebus/service-bus/samples-v1

  This sample demonstrates scenarios as to how a Service Bus message can be explicitly moved to
  the DLQ. For other implicit ways when Service Bus messages get moved to DLQ, refer to -
  https://docs.microsoft.com/azure/service-bus-messaging/service-bus-dead-letter-queues

  Run processMessagesInDLQ example after this to see how the messages in DLQ can be reprocessed.
*/

const { ServiceBusClient } = require("@azure/service-bus");

// Load the .env file if it exists
require("dotenv").config();

// Define connection string and related Service Bus entity names here
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || "<connection string>";
const queueName = process.env.QUEUE_NAME || "<queue name>";
const sbClient = new ServiceBusClient(connectionString);

async function main() {
  try {
    // Sending a message to ensure that there is atleast one message in the main queue
    await sendMessage();

    await receiveMessage();
  } finally {
    await sbClient.close();
  }
}

async function sendMessage() {
  // createSender() can also be used to create a sender for a topic.
  const sender = sbClient.createSender(queueName);

  const message = {
    body: {
      name: "Creamy Chicken Pasta",
      type: "Dinner"
    },
    contentType: "application/json",
    label: "Recipe"
  };
  await sender.sendMessages(message);
  await sender.close();
}

async function receiveMessage() {
  // If receiving from a subscription you can use the createReceiver(topic, subscription) overload
  const receiver = sbClient.createReceiver(queueName);

  const messages = await receiver.receiveMessages(1);

  if (messages.length) {
    console.log(
      ">>>>> Deadletter the one message received from the main queue - ",
      messages[0].body
    );
    // Deadletter the message received
    await messages[0].deadLetter({
      deadLetterReason: "Incorrect Recipe type",
      deadLetterErrorDescription: "Recipe type does not match preferences."
    });
  } else {
    console.log(">>>> Error: No messages were received from the main queue.");
  }

  await receiver.close();
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});
