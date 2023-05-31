# CrossFrameMessenger

CrossFrameMessenger is a robust and efficient TypeScript/JavaScript library designed to simplify cross-frame communication in web development. The library provides a set of APIs that allow seamless message transmission between different frames (i.e., windows or iframes) in a web application.

## Features

- Easy-to-use APIs for sending and receiving messages across frames.
- Message confirmation capability for reliable communication.
- Debug mode for troubleshooting and development.
- Highly customizable, supports communication over specified channels.

## Installation

CrossFrameMessenger can be installed using npm:

```bash
npm install cross-frame-messenger
```

Please note that the CrossFrameMessenger class should be installed and used on both the sender and receiver ends for efficient and smooth communication.

## Usage

To use the CrossFrameMessenger, you'll need to import it in your TypeScript/JavaScript file:

```javascript
import { CrossFrameMessenger } from 'cross-frame-messenger';
```

You can import the class and types from the package if needed like so:

```typescript
import { CrossFrameMessenger, MessageCallback, ConfirmationCallback } from 'cross-frame-messenger';
```

### Instantiation

To create a new instance of CrossFrameMessenger, you need to specify the target window and the target origin. Optionally, you can provide a configuration object:

```javascript
const messenger = new CrossFrameMessenger(targetWindow, targetOrigin, options);
```

- `targetWindow`: The window object of the target frame.
- `targetOrigin`: The origin URL of the target frame.
- `options`: An optional configuration object which can include:
  - `name`: A custom name for the messenger instance (defaults to the document title).
  - `channel`: A custom channel for the communication (a prefix for the event types).
  - `debug`: A boolean indicating whether to enable debug mode (default is `false`).

### Methods

Here are some of the main methods provided by the CrossFrameMessenger class:

- `listen()`: Start listening for messages.
- `stop()`: Stop listening for messages.
- `on(eventTypes, callback)`: Register a callback function for one or more event types. The **callback** function receives the data sent with the event and a confirm function. The confirm function can be used to send a confirmation back to the message sender. It accepts two parameters: a boolean indicating the success of the operation, and an optional data object.
- `send(eventType, data, isConfirmation, confirmationId, event)`: Send a message of a certain event type.
- `sendWithConfirmation(eventType, data)`: Send a message and expect a confirmation response. This method returns a Promise that resolves with the data from the confirmation if successful, or rejects with the error data if not.

For more details, please refer to the comments in the TypeScript file.

### Examples

Let's consider an example where we have two frames, a "Sender" frame and a "Receiver" frame. Both of these frames need to have an instance of `CrossFrameMessenger` installed and properly configured.

#### In the Sender frame
```javascript
import { CrossFrameMessenger } from 'cross-frame-messenger';

// Let's assume that the targetWindow is the reference to the Receiver frame's window
const senderMessenger = new CrossFrameMessenger(targetWindow, targetOrigin, { name: 'Sender' });

// Send a 'greetings' message without expecting any confirmation
senderMessenger.send('greetings', { message: 'Hello, there!' });

// Send a 'request' message expecting a confirmation response
senderMessenger.sendWithConfirmation('request', { item: 'Some data' })
    .then(data => {
        console.log("Request was successfully received! Response:", data);
    })
    .catch(error => {
        console.log("Something went wrong. Error:", error);
    });
```

#### In the Receiver frame
```javascript
import { CrossFrameMessenger } from 'cross-frame-messenger';

// Let's assume that the targetWindow is the reference to the Sender frame's window
const receiverMessenger = new CrossFrameMessenger(targetWindow, targetOrigin, { name: 'Receiver' });

// Listen for 'greetings' messages
receiverMessenger.on('greetings', (data) => {
    console.log("Received greetings:", data.message);
});

// Listen for 'request' messages and respond with a confirmation
receiverMessenger.on('request', (data, confirm) => {
    console.log("Received request for:", data.item);
    // process the request here...

    // Then send a confirmation response back
    confirm(true, { response: 'Request processed!' });
});
```

This example illustrates a typical use-case of the `CrossFrameMessenger` class where two frames are communicating with each other via messages. The Sender frame sends a `greetings` message and a `request` message that expects a confirmation. The Receiver frame listens for these messages, processes the `request`, and sends a confirmation back.

In the 'request' event callback, the **confirm** function is used to send a confirmation back to the sender of the message. This function takes two arguments: a boolean indicating success or failure, and an optional data object containing any additional information you want to send back with the confirmation. This is useful when the sender needs to know if the processing of the message was successful or if there was an error.

## Contribution

This project is open source, and contributions are very welcome! If you're interested in improving CrossFrameMessenger, feel free to create a pull request.

## License

CrossFrameMessenger is licensed under the MIT license. See [LICENSE](LICENSE) for more information.