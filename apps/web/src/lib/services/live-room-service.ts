import { calculateQuizScore, sanitizeNickname } from '@chizmo/core';
import { DeckService } from './deck-service';

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
  hostId: string;
  deckId: string;
  deckTitle: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  questionDurationSec: number;
  questionStartTs: number;
  questions: LiveQuestion[];
  players: Map<string, LivePlayer>;
  createdAt: number;
}

// In-Memory store for active multiplayer quiz rooms
const activeRooms = new Map<string, LiveRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const LiveRoomService = {
  /**
   * Create a new Live Quiz Room
   */
  async createRoom(hostId: string, deckId: string, questionDurationSec = 15): Promise<LiveRoom | null> {
    const deck = await DeckService.getDeckById(deckId, hostId);
    if (!deck || !deck.cards || deck.cards.length === 0) return null;

    // Convert deck cards to multiple choice questions with distractors
    const questions: LiveQuestion[] = deck.cards.map((card, idx) => {
      const otherCards = deck.cards!.filter((c) => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3).map((c) => c.back);

      while (distractors.length < 3) {
        distractors.push(`Alternative concept ${distractors.length + 1}`);
      }

      const allChoices = [...distractors, card.back].sort(() => 0.5 - Math.random());
      const correctIndex = allChoices.indexOf(card.back);

      return {
        cardId: card.id,
        prompt: card.front,
        choices: allChoices,
        correctIndex,
        explanation: card.explanation || card.hint,
      };
    });

    let code = generateRoomCode();
    while (activeRooms.has(code)) {
      code = generateRoomCode();
    }

    const room: LiveRoom = {
      code,
      hostId,
      deckId,
      deckTitle: deck.title,
      status: 'LOBBY',
      currentQuestionIndex: 0,
      questionDurationSec,
      questionStartTs: 0,
      questions,
      players: new Map<string, LivePlayer>(),
      createdAt: Date.now(),
    };

    activeRooms.set(code, room);
    return room;
  },

  /**
   * Get room by code
   */
  getRoom(code: string): LiveRoom | null {
    return activeRooms.get(code.toUpperCase()) || null;
  },

  /**
   * Join a room as a player
   */
  joinRoom(code: string, playerId: string, nickname: string, avatar = '⚡'): { success: boolean; player?: LivePlayer; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { success: false, error: 'Room not found. Check the 6-character code.' };
    if (room.status !== 'LOBBY') return { success: false, error: 'Game has already started!' };

    const sanitized = sanitizeNickname(nickname);

    const player: LivePlayer = {
      id: playerId,
      nickname: sanitized,
      avatar,
      score: 0,
      streak: 0,
      missedCardIds: [],
    };

    room.players.set(playerId, player);
    return { success: true, player };
  },

  /**
   * Advance game state (Host authoritative control)
   */
  advanceState(code: string, hostId: string, nextStatus: RoomStatus): LiveRoom | null {
    const room = this.getRoom(code);
    if (!room || room.hostId !== hostId) return null;

    room.status = nextStatus;

    if (nextStatus === 'QUESTION') {
      room.questionStartTs = Date.now();
      // Reset last answer for all players
      for (const p of room.players.values()) {
        p.lastAnswer = undefined;
      }
    } else if (nextStatus === 'LEADERBOARD') {
      // Advance to next question index for subsequent round
      if (room.currentQuestionIndex + 1 < room.questions.length) {
        room.currentQuestionIndex += 1;
      } else {
        room.status = 'PODIUM';
      }
    }

    return room;
  },

  /**
   * Submit answer from a player
   */
  submitAnswer(
    code: string,
    playerId: string,
    choiceIndex: number,
    responseMs: number
  ): { isCorrect: boolean; pointsAwarded: number; streak: number; totalScore: number } | null {
    const room = this.getRoom(code);
    if (!room || room.status !== 'QUESTION') return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    const currentQ = room.questions[room.currentQuestionIndex];
    if (!currentQ) return null;

    const isCorrect = choiceIndex === currentQ.correctIndex;

    const now = Date.now();
    const serverStartTs = room.questionStartTs;
    const clientTs = serverStartTs + responseMs;

    const scoreResult = calculateQuizScore({
      basePoints: 1000,
      totalAllowedMs: room.questionDurationSec * 1000,
      serverStartTs,
      clientAnswerTs: clientTs,
      serverReceiveTs: now,
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

    return {
      isCorrect,
      pointsAwarded,
      streak: player.streak,
      totalScore: player.score,
    };
  },

  /**
   * Get leaderboard rankings
   */
  getLeaderboard(code: string) {
    const room = this.getRoom(code);
    if (!room) return [];

    const list = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
    return list.map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
    }));
  },
};
