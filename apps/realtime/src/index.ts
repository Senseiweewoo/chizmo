import { Server, Socket } from 'socket.io';
import crypto from 'node:crypto';
import { calculateQuizScore, sanitizeNickname } from '@chizmo/core';
import { prisma } from '@chizmo/db';

const PORT = Number(process.env.PORT || 4001);

export type RoomStatus = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'PODIUM' | 'ENDED';

export interface LiveQuestion {
  cardId: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export interface LivePlayer {
  id: string;
  socketId: string;
  rejoinToken: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  missedCardIds: string[];
  lastAnswer?: {
    choiceIndex: number;
    isCorrect: boolean;
    pointsAwarded: number;
    responseMs: number;
  };
}

export interface LiveRoom {
  code: string;
  hostSocketId: string;
  deckId: string;
  deckTitle: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  questionDurationSec: number;
  questionStartServerTs: number;
  questionEndsServerTs: number;
  questions: LiveQuestion[];
  players: Map<string, LivePlayer>;
  answersByQuestion: Map<number, Map<string, number>>; // questionIndex -> (playerId -> choiceIndex)
  createdAt: number;
}

// In-Memory Real-Time State Store
const rooms = new Map<string, LiveRoom>();
const playerTokenMap = new Map<string, { roomCode: string; playerId: string }>();

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log(`⚡ Chizmo Live Quiz Realtime Server listening on port ${PORT}...`);

function getLeaderboardList(room: LiveRoom) {
  const sorted = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
  return sorted.map((p, idx) => ({
    rank: idx + 1,
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    score: p.score,
    streak: p.streak,
  }));
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Latency Handshake (ping/pong for latency fairness)
  socket.on('ping_check', (data: { clientTs: number }) => {
    socket.emit('pong_reply', {
      clientTs: data?.clientTs || Date.now(),
      serverTs: Date.now(),
    });
  });

  // 1. Host: Initialize Live Quiz Room
  socket.on(
    'host_init_room',
    ({
      code,
      deckId,
      deckTitle,
      questions,
      questionDurationSec = 15,
    }: {
      code: string;
      deckId: string;
      deckTitle: string;
      questions: LiveQuestion[];
      questionDurationSec?: number;
    }) => {
      const roomCode = code.toUpperCase();
      const room: LiveRoom = {
        code: roomCode,
        hostSocketId: socket.id,
        deckId,
        deckTitle,
        status: 'LOBBY',
        currentQuestionIndex: 0,
        questionDurationSec,
        questionStartServerTs: 0,
        questionEndsServerTs: 0,
        questions: questions || [],
        players: new Map(),
        answersByQuestion: new Map(),
        createdAt: Date.now(),
      };

      rooms.set(roomCode, room);
      socket.join(roomCode);
      console.log(`[Host] Created room ${roomCode} with ${room.questions.length} questions`);

      socket.emit('host_room_ready', {
        code: roomCode,
        totalQuestions: room.questions.length,
        durationSec: questionDurationSec,
      });
    }
  );

  // 2. Player: Join Room
  socket.on(
    'join_room',
    ({
      code,
      nickname,
      avatar = '⚡',
    }: {
      code: string;
      nickname: string;
      avatar?: string;
    }) => {
      const roomCode = code?.toUpperCase();
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit('error_message', { code: 'ROOM_NOT_FOUND', message: 'Room code not found.' });
        return;
      }

      if (room.status !== 'LOBBY') {
        socket.emit('error_message', { code: 'GAME_ALREADY_STARTED', message: 'Game has already started!' });
        return;
      }

      const cleanNickname = sanitizeNickname(nickname);
      const playerId = crypto.randomUUID();
      const rejoinToken = crypto.randomBytes(16).toString('hex');

      const player: LivePlayer = {
        id: playerId,
        socketId: socket.id,
        rejoinToken,
        nickname: cleanNickname,
        avatar,
        score: 0,
        streak: 0,
        missedCardIds: [],
      };

      room.players.set(playerId, player);
      playerTokenMap.set(rejoinToken, { roomCode, playerId });
      socket.join(roomCode);

      console.log(`[Room ${roomCode}] Player "${cleanNickname}" joined (${playerId}).`);

      socket.emit('room_joined', {
        playerId,
        rejoinToken,
        nickname: cleanNickname,
        avatar,
        roomCode,
        deckTitle: room.deckTitle,
        totalQuestions: room.questions.length,
      });

      // Broadcast updated player list
      io.to(roomCode).emit('player_list_updated', {
        playerCount: room.players.size,
        players: Array.from(room.players.values()).map((p) => ({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
        })),
      });
    }
  );

  // 3. Player: Rejoin Room (Disconnect Recovery)
  socket.on('rejoin_room', ({ token }: { token: string }) => {
    const session = playerTokenMap.get(token);
    if (!session) {
      socket.emit('error_message', { code: 'INVALID_TOKEN', message: 'Reconnection session expired.' });
      return;
    }

    const room = rooms.get(session.roomCode);
    if (!room) {
      socket.emit('error_message', { code: 'ROOM_ENDED', message: 'The game room has ended.' });
      return;
    }

    const player = room.players.get(session.playerId);
    if (!player) {
      socket.emit('error_message', { code: 'PLAYER_NOT_FOUND', message: 'Player record not found.' });
      return;
    }

    // Update socket mapping
    player.socketId = socket.id;
    socket.join(session.roomCode);

    const currentQ = room.questions[room.currentQuestionIndex];
    socket.emit('rejoin_success', {
      playerId: player.id,
      nickname: player.nickname,
      avatar: player.avatar,
      score: player.score,
      streak: player.streak,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      currentQuestion:
        currentQ && room.status === 'QUESTION'
          ? {
              index: room.currentQuestionIndex,
              prompt: currentQ.prompt,
              choices: currentQ.choices,
              endsAtServerTs: room.questionEndsServerTs,
            }
          : null,
    });
  });

  // 4. Host: Start / Advance Question
  socket.on('start_question', ({ code, questionIndex }: { code: string; questionIndex: number }) => {
    const room = rooms.get(code?.toUpperCase());
    if (!room || room.hostSocketId !== socket.id) return;

    if (questionIndex >= room.questions.length) {
      // Reached end of questions -> Podium
      room.status = 'PODIUM';
      io.to(room.code).emit('podium_revealed', {
        leaderboard: getLeaderboardList(room),
      });
      return;
    }

    const currentQ = room.questions[questionIndex];
    const serverStartTs = Date.now();
    const durationMs = room.questionDurationSec * 1000;

    room.status = 'QUESTION';
    room.currentQuestionIndex = questionIndex;
    room.questionStartServerTs = serverStartTs;
    room.questionEndsServerTs = serverStartTs + durationMs;
    room.answersByQuestion.set(questionIndex, new Map());

    // Reset last answers
    for (const p of room.players.values()) {
      p.lastAnswer = undefined;
    }

    // Broadcast question to all participants (STRICTLY OMIT correctIndex)
    io.to(room.code).emit('question_active', {
      questionIndex,
      totalQuestions: room.questions.length,
      prompt: currentQ.prompt,
      choices: currentQ.choices,
      serverStartTs,
      endsAtServerTs: room.questionEndsServerTs,
      durationSec: room.questionDurationSec,
    });
  });

  // 5. Player: Submit Answer (Server-Authoritative Evaluation)
  socket.on(
    'submit_answer',
    ({
      code,
      playerId,
      questionIndex,
      choiceIndex,
      clientTs,
    }: {
      code: string;
      playerId: string;
      questionIndex: number;
      choiceIndex: number;
      clientTs: number;
    }) => {
      const room = rooms.get(code?.toUpperCase());
      if (!room || room.status !== 'QUESTION' || room.currentQuestionIndex !== questionIndex) {
        return;
      }

      const player = room.players.get(playerId);
      if (!player) return;

      const answersMap = room.answersByQuestion.get(questionIndex) || new Map<string, number>();
      if (answersMap.has(playerId)) {
        // Idempotency: duplicate answer submission ignored
        return;
      }
      answersMap.set(playerId, choiceIndex);
      room.answersByQuestion.set(questionIndex, answersMap);

      const serverReceiveTs = Date.now();
      const currentQ = room.questions[questionIndex];

      // Late submission check (1500ms network jitter buffer)
      if (serverReceiveTs > room.questionEndsServerTs + 1500) {
        socket.emit('answer_acknowledged', {
          pointsAwarded: 0,
          isCorrect: false,
          streak: 0,
          totalScore: player.score,
          late: true,
        });
        return;
      }

      // Server calculates correctness
      const isCorrect = choiceIndex === currentQ.correctIndex;
      const responseMs = Math.max(0, serverReceiveTs - room.questionStartServerTs);

      const scoreResult = calculateQuizScore({
        basePoints: 1000,
        totalAllowedMs: room.questionDurationSec * 1000,
        serverStartTs: room.questionStartServerTs,
        clientAnswerTs: clientTs || serverReceiveTs,
        serverReceiveTs,
        isCorrect,
        currentStreak: player.streak,
      });

      const pointsAwarded = scoreResult.pointsAwarded;

      if (isCorrect) {
        player.streak += 1;
        player.score += pointsAwarded;
      } else {
        player.streak = 0;
        player.missedCardIds.push(currentQ.cardId);
      }

      player.lastAnswer = {
        choiceIndex,
        isCorrect,
        pointsAwarded,
        responseMs,
      };

      // Acknowledge to player
      socket.emit('answer_acknowledged', {
        pointsAwarded,
        isCorrect,
        streak: player.streak,
        totalScore: player.score,
      });

      // Notify host of answer progress
      io.to(room.hostSocketId).emit('answer_progress_updated', {
        answersCount: answersMap.size,
        totalPlayers: room.players.size,
      });
    }
  );

  // 6. Host: Reveal Correct Answer
  socket.on('reveal_question', ({ code }: { code: string }) => {
    const room = rooms.get(code?.toUpperCase());
    if (!room || room.hostSocketId !== socket.id) return;

    room.status = 'REVEAL';
    const currentQ = room.questions[room.currentQuestionIndex];
    const answersMap = room.answersByQuestion.get(room.currentQuestionIndex) || new Map();

    // Choice distribution
    const distribution = new Array(currentQ.choices.length).fill(0);
    for (const choiceIdx of answersMap.values()) {
      if (distribution[choiceIdx] !== undefined) {
        distribution[choiceIdx]++;
      }
    }

    io.to(room.code).emit('question_revealed', {
      questionIndex: room.currentQuestionIndex,
      correctIndex: currentQ.correctIndex,
      explanation: currentQ.explanation,
      distribution,
    });
  });

  // 7. Host: Show Leaderboard
  socket.on('show_leaderboard', ({ code }: { code: string }) => {
    const room = rooms.get(code?.toUpperCase());
    if (!room || room.hostSocketId !== socket.id) return;

    room.status = 'LEADERBOARD';
    const leaderboard = getLeaderboardList(room);

    io.to(room.code).emit('leaderboard_update', {
      leaderboard: leaderboard.slice(0, 5),
      totalPlayers: room.players.size,
    });
  });

  // 8. Player: Save Missed Questions to Personal Deck
  socket.on(
    'save_missed_cards',
    async ({
      code,
      playerId,
      userId,
    }: {
      code: string;
      playerId: string;
      userId: string;
    }) => {
      const room = rooms.get(code?.toUpperCase());
      if (!room) return;

      const player = room.players.get(playerId);
      if (!player || player.missedCardIds.length === 0 || !userId) {
        socket.emit('missed_cards_saved', { savedCount: 0 });
        return;
      }

      try {
        let savedCount = 0;
        for (const cardId of player.missedCardIds) {
          const existingState = await prisma.cardState.findFirst({
            where: { userId, cardId },
          });

          if (!existingState) {
            await prisma.cardState.create({
              data: {
                userId,
                cardId,
                state: 'LEARNING',
                due: new Date(),
                reps: 0,
                lapses: 1,
              },
            });
            savedCount++;
          }
        }

        socket.emit('missed_cards_saved', { savedCount });
      } catch (err) {
        console.error('Error saving missed cards to study queue:', err);
        socket.emit('missed_cards_saved', { savedCount: 0, error: 'Failed to save cards' });
      }
    }
  );

  // 9. Host: Kick Player
  socket.on('kick_player', ({ code, playerId }: { code: string; playerId: string }) => {
    const room = rooms.get(code?.toUpperCase());
    if (!room || room.hostSocketId !== socket.id) return;

    const player = room.players.get(playerId);
    if (player) {
      room.players.delete(playerId);
      io.to(player.socketId).emit('kicked_from_room', { reason: 'Removed by host' });
      io.to(room.code).emit('player_list_updated', {
        playerCount: room.players.size,
        players: Array.from(room.players.values()).map((p) => ({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
        })),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});
