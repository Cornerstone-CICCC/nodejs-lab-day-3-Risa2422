import { Server, Socket } from 'socket.io';
import { Chat } from '../models/chat.model';

const setupChatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // On connect
    console.log(`User connected: ${socket.id}`);

    // Listen to 'sendMessage' event
    socket.on('sendMessage', async (data) => {
      const { username, message } = data;

      try {
        // Save message to MongoDB
        const chat = new Chat({ username, message });
        await chat.save();

        if (chat.room === "") {
          // Broadcast the chat object to all connected clients via the newMessage event
          io.emit("newMessage", chat);
        } else {
          // For room-based broadcast
          io.to(data.room).emit("newPrivateMessage", chat);
        }
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    });

    // Joining a room
    socket.on("join room", async (data) => {
      socket.join(data.room);

      // Save message to MongoDB
      const { username, message, room } = data;
      const chat = new Chat({ username, message, room });
      console.log("chatです", chat);
      await chat.save();

      io.to(data.room).emit("newMessage", {
        text: `${data.username} joined the room ${data.room}`,
        username: "System",
        room: data.room,
      });
    });

    // Leaving a room
    socket.on("leave room", (data) => {
      socket.leave(data.room);
      io.to(data.room).emit("newMessage", {
        text: `${data.username} has left the room ${data.room}`,
        username: "System",
        room: data.room,
      });
    });

    // On disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export default setupChatSocket;