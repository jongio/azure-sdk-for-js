// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as dotenv from "dotenv";
import {
  delay,
  QueueClient,
  ReceiveMode,
  ServiceBusClient,
  ServiceBusMessage,
  SubscriptionClient,
  TopicClient
} from "../../src";
import { Receiver } from "../../src/receiver";
import { Sender } from "../../src/sender";
import { DispositionType } from "../../src/serviceBusMessage";
import { getAlreadyReceivingErrorMsg } from "../../src/util/errors";
import {
  checkWithTimeout,
  TestClientType,
  getSenderReceiverClients,
  purge,
  TestMessage
} from "./testUtils";
const should = chai.should();
dotenv.config();
chai.use(chaiAsPromised);

async function testPeekMsgsLength(
  client: QueueClient | SubscriptionClient,
  expectedPeekLength: number
): Promise<void> {
  const peekedMsgs = await client.peek(expectedPeekLength + 1);
  should.equal(
    peekedMsgs.length,
    expectedPeekLength,
    "Unexpected number of msgs found when peeking"
  );
}

let ns: ServiceBusClient;
let senderClient: QueueClient | TopicClient;
let receiverClient: QueueClient | SubscriptionClient;
let sender: Sender;
let receiver: Receiver;
let deadLetterClient: QueueClient | SubscriptionClient;
let errorWasThrown: boolean;
let unexpectedError: Error | undefined;

function unExpectedErrorHandler(err: Error): void {
  if (err) {
    unexpectedError = err;
  }
}

async function beforeEachTest(
  senderType: TestClientType,
  receiverType: TestClientType,
  receiveMode?: ReceiveMode
): Promise<void> {
  // The tests in this file expect the env variables to contain the connection string and
  // the names of empty queue/topic/subscription that are to be tested

  // @ts-ignore
  if (!window.__env__["SERVICEBUS_CONNECTION_STRING"]) {
    throw new Error(
      "Define SERVICEBUS_CONNECTION_STRING in your environment before running integration tests."
    );
  }

  // @ts-ignore
  ns = ServiceBusClient.createFromConnectionString(window.__env__["SERVICEBUS_CONNECTION_STRING"]);

  const clients = await getSenderReceiverClients(ns, senderType, receiverType);
  senderClient = clients.senderClient;
  receiverClient = clients.receiverClient;

  if (receiverClient instanceof QueueClient) {
    deadLetterClient = ns.createQueueClient(
      QueueClient.getDeadLetterQueuePath(receiverClient.entityPath)
    );
  }

  if (receiverClient instanceof SubscriptionClient) {
    deadLetterClient = ns.createSubscriptionClient(
      TopicClient.getDeadLetterTopicPath(senderClient.entityPath, receiverClient.subscriptionName),
      receiverClient.subscriptionName
    );
  }

  await purge(receiverClient);
  await purge(deadLetterClient);
  const peekedMsgs = await receiverClient.peek();
  const receiverEntityType = receiverClient instanceof QueueClient ? "queue" : "topic";
  if (peekedMsgs.length) {
    chai.assert.fail(`Please use an empty ${receiverEntityType} for integration testing`);
  }
  const peekedDeadMsgs = await deadLetterClient.peek();
  if (peekedDeadMsgs.length) {
    chai.assert.fail(
      `Please use an empty dead letter ${receiverEntityType} for integration testing`
    );
  }

  sender = senderClient.createSender();

  if (!receiveMode) {
    receiveMode = ReceiveMode.peekLock;
  }
  receiver = receiverClient.createReceiver(receiveMode);

  errorWasThrown = false;
  unexpectedError = undefined;
}

async function afterEachTest(): Promise<void> {
  await ns.close();
}

describe("Streaming - Misc Tests", function(): void {
  afterEach(async () => {
    await afterEachTest();
  });

  async function testAutoComplete(): Promise<void> {
    const testMessage = TestMessage.getSample();
    await sender.send(testMessage);

    const receivedMsgs: ServiceBusMessage[] = [];
    receiver.registerMessageHandler((msg: ServiceBusMessage) => {
      receivedMsgs.push(msg);
      should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
      should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");

      return Promise.resolve();
    }, unExpectedErrorHandler);

    const msgsCheck = await checkWithTimeout(
      () => receivedMsgs.length === 1 && receivedMsgs[0].delivery.remote_settled === true
    );

    should.equal(
      msgsCheck,
      true,
      receivedMsgs.length !== 1
        ? `Expected 1, received ${receivedMsgs.length} messages`
        : "Message didnt get auto-completed in time"
    );
    await receiver.close();

    should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
    should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
    await testPeekMsgsLength(receiverClient, 0);
  }

  it("UnPartitioned Queue: AutoComplete removes the message", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testAutoComplete();
  });

  async function testManualComplete(): Promise<void> {
    const testMessage = TestMessage.getSample();
    await sender.send(testMessage);

    const receivedMsgs: ServiceBusMessage[] = [];
    receiver.registerMessageHandler(
      (msg: ServiceBusMessage) => {
        receivedMsgs.push(msg);
        should.equal(msg.body, testMessage.body, "MessageBody is different than expected");
        should.equal(msg.messageId, testMessage.messageId, "MessageId is different than expected");
        return Promise.resolve();
      },
      unExpectedErrorHandler,
      { autoComplete: false }
    );

    const msgsCheck = await checkWithTimeout(() => receivedMsgs.length === 1);

    should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages`);
    await testPeekMsgsLength(receiverClient, 1);
    should.equal(receivedMsgs.length, 1, "Unexpected number of messages");

    await receivedMsgs[0].complete();
    await receiver.close();

    should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
    await testPeekMsgsLength(receiverClient, 0);
  }

  it("UnPartitioned Queue: Disabled autoComplete, no manual complete retains the message", async function(): Promise<
    void
  > {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testManualComplete();
  });
});

describe("Streaming - Multiple Receiver Operations", function(): void {
  afterEach(async () => {
    await afterEachTest();
  });

  async function testMultipleReceiveCalls(): Promise<void> {
    let errorMessage;
    const expectedErrorMessage = getAlreadyReceivingErrorMsg(receiverClient.entityPath);
    receiver.registerMessageHandler((msg: ServiceBusMessage) => {
      return msg.complete();
    }, unExpectedErrorHandler);
    await delay(5000);
    try {
      receiver.registerMessageHandler((msg: ServiceBusMessage) => {
        return Promise.resolve();
      }, unExpectedErrorHandler);
    } catch (err) {
      errorMessage = err && err.message;
    }
    should.equal(
      errorMessage,
      expectedErrorMessage,
      "Unexpected error message for registerMessageHandler"
    );
    should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);

    errorMessage = "";
    try {
      await receiver.receiveMessages(1);
    } catch (err) {
      errorMessage = err && err.message;
    }
    should.equal(
      errorMessage,
      expectedErrorMessage,
      "Unexpected error message for receiveMessages"
    );
  }

  it("UnPartitioned Queue: Second receive operation should fail if the first streaming receiver is not stopped", async function(): Promise<
    void
  > {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testMultipleReceiveCalls();
  });
});

describe("Streaming - Settle an already Settled message throws error", () => {
  afterEach(async () => {
    await afterEachTest();
  });

  const testError = (err: Error, operation: DispositionType) => {
    should.equal(
      err.message,
      `Failed to ${operation} the message as this message is already settled.`,
      "ErrorMessage is different than expected"
    );
    errorWasThrown = true;
  };

  async function testSettlement(operation: DispositionType): Promise<void> {
    const testMessage = TestMessage.getSample();
    await sender.send(testMessage);
    const receivedMsgs: ServiceBusMessage[] = [];
    receiver.registerMessageHandler((msg: ServiceBusMessage) => {
      receivedMsgs.push(msg);
      return Promise.resolve();
    }, unExpectedErrorHandler);

    const msgsCheck = await checkWithTimeout(
      () => receivedMsgs.length === 1 && receivedMsgs[0].delivery.remote_settled === true
    );
    should.equal(
      msgsCheck,
      true,
      receivedMsgs.length !== 1
        ? `Expected 1, received ${receivedMsgs.length} messages`
        : "Message didnt get auto-completed in time"
    );

    should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);

    should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
    should.equal(receivedMsgs[0].body, testMessage.body, "MessageBody is different than expected");
    should.equal(
      receivedMsgs[0].messageId,
      testMessage.messageId,
      "MessageId is different than expected"
    );

    await testPeekMsgsLength(receiverClient, 0);

    if (operation === DispositionType.complete) {
      await receivedMsgs[0].complete().catch((err) => testError(err, operation));
    } else if (operation === DispositionType.abandon) {
      await receivedMsgs[0].abandon().catch((err) => testError(err, operation));
    } else if (operation === DispositionType.deadletter) {
      await receivedMsgs[0].deadLetter().catch((err) => testError(err, operation));
    } else if (operation === DispositionType.defer) {
      await receivedMsgs[0].defer().catch((err) => testError(err, operation));
    }

    should.equal(errorWasThrown, true, "Error thrown flag must be true");
  }

  it("UnPartitioned Queue: complete() throws error", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testSettlement(DispositionType.complete);
  });

  it("UnPartitioned Queue: abandon() throws error", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testSettlement(DispositionType.abandon);
  });

  it("UnPartitioned Queue: defer() throws error", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testSettlement(DispositionType.defer);
  });

  it("UnPartitioned Queue: deadLetter() throws error", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testSettlement(DispositionType.deadletter);
  });
});

describe("Streaming - User Error", function(): void {
  afterEach(async () => {
    await afterEachTest();
  });

  async function testUserError(): Promise<void> {
    await sender.send(TestMessage.getSample());
    const errorMessage = "Will we see this error message?";

    const receivedMsgs: ServiceBusMessage[] = [];
    receiver.registerMessageHandler(async (msg: ServiceBusMessage) => {
      await msg.complete().then(() => {
        receivedMsgs.push(msg);
      });
      throw new Error(errorMessage);
    }, unExpectedErrorHandler);

    const msgsCheck = await checkWithTimeout(() => receivedMsgs.length === 1);

    should.equal(msgsCheck, true, `Expected 1, received ${receivedMsgs.length} messages.`);
    await receiver.close();

    should.equal(
      unexpectedError && unexpectedError.message,
      errorMessage,
      "User error did not surface."
    );
    should.equal(receivedMsgs.length, 1, "Unexpected number of messages");
  }

  it("UnPartitioned Queue: onError handler is called for user error", async function(): Promise<
    void
  > {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testUserError();
  });
});

describe("Streaming - maxConcurrentCalls", function(): void {
  afterEach(async () => {
    await afterEachTest();
  });

  async function testConcurrency(maxConcurrentCalls?: number): Promise<void> {
    const testMessages = [TestMessage.getSample(), TestMessage.getSample()];
    await sender.sendBatch(testMessages);

    const settledMsgs: ServiceBusMessage[] = [];
    const receivedMsgs: ServiceBusMessage[] = [];

    receiver.registerMessageHandler(
      async (msg: ServiceBusMessage) => {
        if (receivedMsgs.length === 1) {
          if ((!maxConcurrentCalls || maxConcurrentCalls === 1) && settledMsgs.length === 0) {
            throw new Error(
              "onMessage for the second message should not have been called before the first message got settled"
            );
          }
        } else {
          if (maxConcurrentCalls && maxConcurrentCalls > 1 && settledMsgs.length !== 0) {
            throw new Error(
              "onMessage for the second message should have been called before the first message got settled"
            );
          }
        }

        receivedMsgs.push(msg);
        await delay(2000);
        await msg.complete().then(() => {
          settledMsgs.push(msg);
        });
      },
      unExpectedErrorHandler,
      maxConcurrentCalls ? { maxConcurrentCalls } : {}
    );

    await checkWithTimeout(() => settledMsgs.length === 2);
    await receiver.close();

    should.equal(unexpectedError, undefined, unexpectedError && unexpectedError.message);
    should.equal(settledMsgs.length, 2, `Expected 2, received ${settledMsgs.length} messages.`);
  }

  it("Unpartitioned Queue: no maxConcurrentCalls passed", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testConcurrency();
  });

  it("Unpartitioned Queue: pass 1 for maxConcurrentCalls", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testConcurrency(1);
  });

  it("Unpartitioned Queue: pass 2 for maxConcurrentCalls", async function(): Promise<void> {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testConcurrency(2);
  });
});

describe("Streaming - Not receive messages after receiver is closed", function(): void {
  afterEach(async () => {
    await afterEachTest();
  });

  async function testReceiveMessages(): Promise<void> {
    const totalNumOfMessages = 5;
    let num = 1;
    const messages = [];
    while (num <= totalNumOfMessages) {
      const message = {
        messageId: num,
        body: "test",
        label: `${num}`,
        partitionKey: "dummy" // Ensures all messages go to same parition to make peek work reliably
      };
      num++;
      messages.push(message);
    }
    await sender.sendBatch(messages);

    const receivedMsgs: ServiceBusMessage[] = [];

    const onMessageHandler = async (brokeredMessage: ServiceBusMessage) => {
      receivedMsgs.push(brokeredMessage);
      await brokeredMessage.complete();
    };

    receiver.registerMessageHandler(onMessageHandler, unExpectedErrorHandler, {
      autoComplete: false
    });
    await receiver.close();

    await delay(5000);
    should.equal(
      receivedMsgs.length,
      0,
      `Expected 0 messages, but received ${receivedMsgs.length}`
    );
    await testPeekMsgsLength(receiverClient, totalNumOfMessages);
  }

  it("UnPartitioned Queue: Not receive messages after receiver is closed", async function(): Promise<
    void
  > {
    await beforeEachTest(TestClientType.UnpartitionedQueue, TestClientType.UnpartitionedQueue);
    await testReceiveMessages();
  });

  it("UnPartitioned Queue: (Receive And Delete mode) Not receive messages after receiver is closed", async function(): Promise<
    void
  > {
    await beforeEachTest(
      TestClientType.UnpartitionedQueue,
      TestClientType.UnpartitionedQueue,
      ReceiveMode.receiveAndDelete
    );
    await testReceiveMessages();
  });
});