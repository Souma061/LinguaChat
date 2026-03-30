import dotenv from 'dotenv';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { Socket as ClientSocket, io as ioClient } from 'socket.io-client';

import app from '../src/app';
import { socketAuthMiddleware } from '../src/middlewares/socketAuth.middleware';
import Message from '../src/models/message.model';
import { Room } from '../src/models/room.model';
import User from '../src/models/user.model';
import { initializeChatSocket } from '../src/sockets/chat.socket';
import type { ClientToServerInterface, ServerToClientInterface } from '../src/types/socket.d';

dotenv.config();

describe('Chat Message Test', () => {
  let httpServer: any;
  let io: Server;
  let clientSocket1: ClientSocket<ServerToClientInterface, ClientToServerInterface>;
  let clientSocket2: ClientSocket<ServerToClientInterface, ClientToServerInterface>;
  let port: number;


  let token1: string;
  let token2: string;
  // Your test message
  const testMessage = {
    room: "global",
    author: "Souma",
    message: "Hello world, this is a test.",
    sourceLocale: "en",
    msgId: "test-1"
  };

  beforeAll(async () => {
    // Create HTTP server and Socket.IO instance
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Match production auth path
    io.use(socketAuthMiddleware);

    // Initialize chat socket handlers
    initializeChatSocket(io);

    // Create test users + a Native-mode room to avoid external translation calls
    const user1 = await User.create({
      username: 'socketuser1',
      email: 'socketuser1@example.com',
      password: 'x',
      role: 'user',
    });
    const user2 = await User.create({
      username: 'socketuser2',
      email: 'socketuser2@example.com',
      password: 'x',
      role: 'user',
    });

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required for socket auth tests');
    }
    token1 = jwt.sign({ id: user1._id.toString(), role: user1.role }, process.env.JWT_SECRET);
    token2 = jwt.sign({ id: user2._id.toString(), role: user2.role }, process.env.JWT_SECRET);

    await Room.deleteMany({ name: 'global' });
    await Room.create({
      name: 'global',
      owner: user1._id,
      admins: [user1._id],
      members: [user1._id, user2._id],
      mode: 'Native',
      isPublic: true,
      description: '',
    });

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address()?.port;
        console.log(`✅ Test server running on port ${port}`);
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    // Cleanup
    await Message.deleteMany({});
    await Room.deleteMany({});
    await User.deleteMany({});

    if (clientSocket1?.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect();
    }

    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }

  });

  beforeEach(async () => {
    // Clean messages before each test
    await Message.deleteMany({});
  });

  afterEach(() => {
    if (clientSocket1?.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect();
    }
  });

  test('should successfully send and receive the test chat message', async () => {
    console.log('🚀 Testing Chat Message:', JSON.stringify(testMessage, null, 2));

    // Create client connections
    clientSocket1 = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket'],
      auth: { token: token1 },
    });

    clientSocket2 = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket'],
      auth: { token: token2 },
    });

    // Wait for both clients to connect
    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.on('connect', () => {
          console.log('✅ Client 1 (Sender) connected');
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        clientSocket2.on('connect', () => {
          console.log('✅ Client 2 (Receiver) connected');
          resolve();
        });
      })
    ]);

    // Both clients join the same room
    console.log('🏠 Joining room "global"...');

    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.emit('join_Room', { room: 'global', lang: 'en' });
        clientSocket1.on('room_history', () => {
          console.log('✅ Client 1 joined room and received history');
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        clientSocket2.emit('join_Room', { room: 'global', lang: 'en' });
        clientSocket2.on('room_history', () => {
          console.log('✅ Client 2 joined room and received history');
          resolve();
        });
      })
    ]);

    // Set up message receiving promise
    const messageReceivedPromise = new Promise<any>((resolve) => {
      clientSocket2.on('receive_message', (receivedMessage) => {
        console.log('📥 Message received:', receivedMessage);
        resolve(receivedMessage);
      });
    });

    // Send the test message
    console.log('📤 Sending test message...');
    clientSocket1.emit('send_message', testMessage);

    // Wait for message to be received
    const receivedMessage = await messageReceivedPromise;

    // Assertions
    console.log('\n✅ TEST RESULTS:');
    console.log('==================');

    expect(receivedMessage).toBeDefined();
    // Author is server-controlled (derived from authenticated socket user)
    expect(receivedMessage.author).toBe('socketuser1');
    expect(receivedMessage.message).toBe(testMessage.message);
    expect(receivedMessage.msgId).toBe(testMessage.msgId);
    expect(receivedMessage.original).toBe(testMessage.message);
    expect(receivedMessage.lang).toBe(testMessage.sourceLocale);
    expect(receivedMessage.time).toBeDefined();
    expect(receivedMessage.reactions).toBeDefined();

    console.log('✅ Author matches:', receivedMessage.author);
    console.log('✅ Message content matches:', receivedMessage.message);
    console.log('✅ Message ID matches:', receivedMessage.msgId);
    console.log('✅ Original content matches:', receivedMessage.original);
    console.log('✅ Language matches:', receivedMessage.lang);
    console.log('✅ Timestamp present:', receivedMessage.time);

    // Verify message was saved to database
    const savedMessage = await Message.findOne({ msgId: testMessage.msgId });
    expect(savedMessage).toBeTruthy();
    expect(savedMessage?.original).toBe(testMessage.message);
    expect(savedMessage?.author).toBe('socketuser1');
    expect(savedMessage?.room).toBe(testMessage.room);
    expect(savedMessage?.sourceLocale).toBe(testMessage.sourceLocale);

    console.log('✅ Message saved to database correctly');
    console.log('\n🎉 Chat message test completed successfully!');
  }, 10000); // 10 second timeout

  test('should handle message with reply structure', async () => {
    const messageWithReply = {
      ...testMessage,
      msgId: "test-2",
      replyTo: {
        msgId: "original-msg-id",
        author: "OriginalAuthor",
        message: "Original message content"
      }
    };

    console.log('🚀 Testing Message with Reply:', JSON.stringify(messageWithReply, null, 2));

    // Create client connections
    clientSocket1 = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket'],
      auth: { token: token1 },
    });

    clientSocket2 = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket'],
      auth: { token: token2 },
    });

    // Wait for connections and join room
    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.on('connect', () => resolve());
      }),
      new Promise<void>((resolve) => {
        clientSocket2.on('connect', () => resolve());
      })
    ]);

    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.emit('join_Room', { room: 'global', lang: 'en' });
        clientSocket1.on('room_history', () => resolve());
      }),
      new Promise<void>((resolve) => {
        clientSocket2.emit('join_Room', { room: 'global', lang: 'en' });
        clientSocket2.on('room_history', () => resolve());
      })
    ]);

    // Set up message receiving
    const messageReceivedPromise = new Promise<any>((resolve) => {
      clientSocket2.on('receive_message', (receivedMessage) => {
        console.log('📥 Reply message received:', receivedMessage);
        resolve(receivedMessage);
      });
    });

    // Send message with reply
    clientSocket1.emit('send_message', messageWithReply);

    const receivedMessage = await messageReceivedPromise;

    // Verify reply structure
    expect(receivedMessage.replyTo).toBeDefined();
    expect(receivedMessage.replyTo.msgId).toBe(messageWithReply.replyTo.msgId);
    expect(receivedMessage.replyTo.author).toBe(messageWithReply.replyTo.author);
    expect(receivedMessage.replyTo.message).toBe(messageWithReply.replyTo.message);

    console.log('✅ Reply structure preserved correctly');
  }, 10000);

  test('should handle multiple messages in sequence', async () => {
    const messages = [
      { ...testMessage, msgId: "test-seq-1", message: "First message" },
      { ...testMessage, msgId: "test-seq-2", message: "Second message" },
      { ...testMessage, msgId: "test-seq-3", message: "Third message" }
    ];

    console.log('🚀 Testing Multiple Messages Sequence');

    // Create client connections
    clientSocket1 = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket'],
      auth: { token: token1 },
    });

    clientSocket2 = ioClient(`http://localhost:${port}`, {
      forceNew: true,
      transports: ['websocket'],
      auth: { token: token2 },
    });

    // Wait for connections and join room
    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.on('connect', () => resolve());
      }),
      new Promise<void>((resolve) => {
        clientSocket2.on('connect', () => resolve());
      })
    ]);

    await Promise.all([
      new Promise<void>((resolve) => {
        clientSocket1.emit('join_Room', { room: 'global', lang: 'en' });
        clientSocket1.on('room_history', () => resolve());
      }),
      new Promise<void>((resolve) => {
        clientSocket2.emit('join_Room', { room: 'global', lang: 'en' });
        clientSocket2.on('room_history', () => resolve());
      })
    ]);

    const receivedMessages: any[] = [];

    // Set up message receiving
    const allMessagesReceived = new Promise<void>((resolve) => {
      clientSocket2.on('receive_message', (receivedMessage) => {
        console.log('📥 Sequential message received:', receivedMessage.message);
        receivedMessages.push(receivedMessage);
        if (receivedMessages.length === messages.length) {
          resolve();
        }
      });
    });

    // Send messages in sequence
    for (const msg of messages) {
      clientSocket1.emit('send_message', msg);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    await allMessagesReceived;

    // Verify all messages were received
    expect(receivedMessages).toHaveLength(messages.length);
    messages.forEach((originalMsg, index) => {
      const receivedMsg = receivedMessages.find(msg => msg.msgId === originalMsg.msgId);
      expect(receivedMsg).toBeDefined();
      expect(receivedMsg.message).toBe(originalMsg.message);
      expect(receivedMsg.author).toBe('socketuser1');
    });

    console.log('✅ All sequential messages handled correctly');
  }, 15000);
});
