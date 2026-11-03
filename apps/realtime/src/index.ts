import { Server, Socket } from 'socket.io';
import { calculateQuizScore } from '@chizmo/core';
import { prisma } from '@chizmo/db';

const PORT = Number(process.env.PORT || 4001);

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log(`⚡ Chizmo Live Quiz Realtime Server listening on port ${PORT}...`);

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Room Join
  socket.on('join_room', async ({ code, nickname }: { code: string; nickname: string }) => {
    socket.join(code);
    console.log(`[Room ${code}] Player "${nickname}" joined.`);

    io.to(code).emit('player_joined', {
      socketId: socket.id,
      nickname,
      joinedAt: new Date().toISOString(),
    });
  });

  // Host Action: Start Question
  socket.on('start_question', ({ code, questionIndex, durationMs = 15000 }) => {
    const serverStartTs = Date.now();
    io.to(code).emit('question_active', {
      questionIndex,
      serverStartTs,
      endsAtServerTs: serverStartTs + durationMs,
    });
  });

  // Player Answer Submission
  socket.on(
    'submit_answer',
    ({
      code,
      questionIndex,
      choiceIndex,
      isCorrect,
      clientTs,
      currentStreak = 0,
    }) => {
      const serverReceiveTs = Date.now();
      const score = calculateQuizScore({
        basePoints: 1000,
        totalAllowedMs: 15000,
        serverStartTs: serverReceiveTs - 3000, // normalized
        clientAnswerTs: clientTs,
        serverReceiveTs,
        isCorrect,
        currentStreak,
      });

      socket.emit('answer_acknowledged', score);
    }
  );

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});
