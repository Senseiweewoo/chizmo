import { prisma } from '@chizmo/db';
import crypto from 'node:crypto';

export interface DeckWithMeta {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  language: string;
  color: string;
  icon: string;
  tags: string[];
  cardCount: number;
  dueToday: number;
  retentionRate: number;
  createdAt: Date;
  updatedAt: Date;
  cards?: any[];
}

function hashContent(front: string, back: string): string {
  return crypto.createHash('sha256').update(`${front.trim()}|${back.trim()}`).digest('hex');
}

// In-Memory Seed Cache for Instant Local / Offline Run
const inMemoryDecks: DeckWithMeta[] = [
  {
    id: 'bio-demo',
    ownerId: 'default-user',
    title: 'AP Biology: Cellular Respiration & Photosynthesis',
    description: 'High-yield conceptual cards covering bioenergetics, light reactions, and oxidative phosphorylation.',
    visibility: 'PUBLIC',
    language: 'en',
    color: '#10B981',
    icon: 'leaf',
    tags: ['Biology', 'AP Exam', 'High-Yield'],
    cardCount: 4,
    dueToday: 4,
    retentionRate: 91,
    createdAt: new Date(),
    updatedAt: new Date(),
    cards: [
      {
        id: 'c-bio-1',
        deckId: 'bio-demo',
        type: 'basic',
        front: 'What are the two primary energetic products of the light-dependent reactions of photosynthesis?',
        back: 'ATP and NADPH (oxygen is also released as a byproduct from water photolysis).',
        hint: 'Energy currency and electron carrier.',
        explanation: 'Both ATP and NADPH are subsequently used in the stroma to power the Calvin Cycle (light-independent reactions).',
        difficultyEstimate: 6,
        tags: ['photosynthesis', 'bioenergetics'],
        position: 0,
      },
      {
        id: 'c-bio-2',
        deckId: 'bio-demo',
        type: 'basic',
        front: 'Where specifically in eukaryotic cells does the Krebs (citric acid) cycle take place?',
        back: 'The mitochondrial matrix.',
        hint: 'Inside the inner mitochondrial membrane.',
        explanation: 'Pyruvate from glycolysis is transported into the matrix, converted to Acetyl-CoA, and enters the citric acid cycle.',
        difficultyEstimate: 4,
        tags: ['cellular-respiration', 'mitochondria'],
        position: 1,
      },
      {
        id: 'c-bio-3',
        deckId: 'bio-demo',
        type: 'basic',
        front: 'Which enzyme is responsible for catalyzing the fixation of carbon dioxide in the Calvin cycle?',
        back: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase).',
        hint: 'Most abundant enzyme on Earth.',
        explanation: 'RuBisCO fixes inorganic CO2 onto 5-carbon RuBP, producing unstable 6-carbon intermediates that split into 3-PGA.',
        difficultyEstimate: 7,
        tags: ['calvin-cycle', 'enzymes'],
        position: 2,
      },
      {
        id: 'c-bio-4',
        deckId: 'bio-demo',
        type: 'basic',
        front: 'What serves as the final electron acceptor in the aerobic electron transport chain?',
        back: 'Molecular Oxygen (O₂), which combines with protons to form water (H₂O).',
        hint: 'Gas inhaled during respiration.',
        explanation: 'Without oxygen accepting electrons at Complex IV, the ETC halts and ATP production via oxidative phosphorylation stops.',
        difficultyEstimate: 5,
        tags: ['electron-transport', 'respiration'],
        position: 3,
      },
    ],
  },
  {
    id: 'sat-demo',
    ownerId: 'default-user',
    title: 'SAT High-Yield Vocabulary',
    description: 'Essential recurring adjectives, verbs, and tonal words for the Digital SAT Reading & Writing section.',
    visibility: 'PUBLIC',
    language: 'en',
    color: '#6366F1',
    icon: 'book-open',
    tags: ['SAT', 'Vocabulary', 'English'],
    cardCount: 3,
    dueToday: 3,
    retentionRate: 88,
    createdAt: new Date(),
    updatedAt: new Date(),
    cards: [
      {
        id: 'c-sat-1',
        deckId: 'sat-demo',
        type: 'basic',
        front: 'Ephemeral',
        back: 'Lasting for a very short time; fleeting or transitory.',
        hint: 'Think of transient beauty.',
        explanation: 'Example: "The ephemeral bloom of cherry blossoms attracts visitors for only a few days."',
        difficultyEstimate: 4,
        tags: ['vocabulary', 'adjectives'],
        position: 0,
      },
      {
        id: 'c-sat-2',
        deckId: 'sat-demo',
        type: 'basic',
        front: 'Ubiquitous',
        back: 'Present, appearing, or found everywhere; omnipresent.',
        hint: 'Smartphones in modern society.',
        explanation: 'Example: "Coffee shops have become ubiquitous in metropolitan areas."',
        difficultyEstimate: 5,
        tags: ['vocabulary', 'adjectives'],
        position: 1,
      },
      {
        id: 'c-sat-3',
        deckId: 'sat-demo',
        type: 'basic',
        front: 'Pragmatic',
        back: 'Dealing with things sensibly and realistically based on practical rather than theoretical considerations.',
        hint: 'Practical and grounded.',
        explanation: 'Example: "She took a pragmatic approach to budget planning, cutting unnecessary expenses first."',
        difficultyEstimate: 4,
        tags: ['vocabulary', 'adjectives'],
        position: 2,
      },
    ],
  },
];

export const DeckService = {
  async getDecks(userId?: string): Promise<DeckWithMeta[]> {
    try {
      const dbDecks = await prisma.deck.findMany({
        where: userId
          ? { OR: [{ ownerId: userId }, { visibility: 'PUBLIC' }] }
          : { visibility: 'PUBLIC' },
        include: {
          cards: true,
          _count: { select: { cards: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (dbDecks.length > 0) {
        return dbDecks.map((d) => ({
          id: d.id,
          ownerId: d.ownerId,
          title: d.title,
          description: d.description,
          visibility: d.visibility as any,
          language: d.language,
          color: d.color || '#6366F1',
          icon: d.icon || 'sparkles',
          tags: d.tags,
          cardCount: d._count.cards,
          dueToday: Math.min(d._count.cards, 10),
          retentionRate: 90,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }));
      }
    } catch {
      // Graceful fallback to in-memory store
    }
    return inMemoryDecks;
  },

  async getDeckById(deckId: string, userId?: string): Promise<DeckWithMeta | null> {
    try {
      const deck = await prisma.deck.findUnique({
        where: { id: deckId },
        include: {
          cards: {
            orderBy: { position: 'asc' },
          },
        },
      });

      if (deck) {
        return {
          id: deck.id,
          ownerId: deck.ownerId,
          title: deck.title,
          description: deck.description,
          visibility: deck.visibility as any,
          language: deck.language,
          color: deck.color || '#6366F1',
          icon: deck.icon || 'sparkles',
          tags: deck.tags,
          cardCount: deck.cards.length,
          dueToday: deck.cards.length,
          retentionRate: 90,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
          cards: deck.cards,
        };
      }
    } catch {
      // fallback
    }

    const found = inMemoryDecks.find((d) => d.id === deckId);
    return found ? { ...found } : null;
  },

  async createDeck(userId: string, data: {
    title: string;
    description?: string;
    visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    language?: string;
    color?: string;
    icon?: string;
    tags?: string[];
  }): Promise<DeckWithMeta> {
    try {
      const created = await prisma.deck.create({
        data: {
          ownerId: userId,
          title: data.title,
          description: data.description,
          visibility: data.visibility || 'PRIVATE',
          language: data.language || 'en',
          color: data.color || '#6366F1',
          icon: data.icon || 'sparkles',
          tags: data.tags || [],
        },
      });

      return {
        id: created.id,
        ownerId: created.ownerId,
        title: created.title,
        description: created.description,
        visibility: created.visibility as any,
        language: created.language,
        color: created.color || '#6366F1',
        icon: created.icon || 'sparkles',
        tags: created.tags,
        cardCount: 0,
        dueToday: 0,
        retentionRate: 100,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        cards: [],
      };
    } catch {
      // In-memory fallback
      const newDeck: DeckWithMeta = {
        id: `deck-${Date.now()}`,
        ownerId: userId,
        title: data.title,
        description: data.description || '',
        visibility: data.visibility || 'PRIVATE',
        language: data.language || 'en',
        color: data.color || '#6366F1',
        icon: data.icon || 'sparkles',
        tags: data.tags || [],
        cardCount: 0,
        dueToday: 0,
        retentionRate: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        cards: [],
      };
      inMemoryDecks.unshift(newDeck);
      return newDeck;
    }
  },

  async updateDeck(deckId: string, userId: string, data: Partial<DeckWithMeta>): Promise<DeckWithMeta | null> {
    try {
      const updated = await prisma.deck.update({
        where: { id: deckId },
        data: {
          title: data.title,
          description: data.description,
          visibility: data.visibility as any,
          color: data.color,
          icon: data.icon,
          tags: data.tags,
        },
      });
      return {
        ...updated,
        visibility: updated.visibility as any,
        color: updated.color || '#6366F1',
        icon: updated.icon || 'sparkles',
        cardCount: 0,
        dueToday: 0,
        retentionRate: 90,
      };
    } catch {
      const deck = inMemoryDecks.find((d) => d.id === deckId);
      if (deck) {
        Object.assign(deck, data, { updatedAt: new Date() });
        return { ...deck };
      }
      return null;
    }
  },

  async deleteDeck(deckId: string, userId: string): Promise<boolean> {
    try {
      await prisma.deck.delete({
        where: { id: deckId },
      });
      return true;
    } catch {
      const idx = inMemoryDecks.findIndex((d) => d.id === deckId);
      if (idx !== -1) {
        inMemoryDecks.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  async addCard(deckId: string, data: {
    front: string;
    back: string;
    type?: string;
    hint?: string;
    explanation?: string;
    choices?: string[];
    tags?: string[];
  }) {
    const hash = hashContent(data.front, data.back);

    try {
      const count = await prisma.card.count({ where: { deckId } });
      const card = await prisma.card.create({
        data: {
          deckId,
          front: data.front,
          back: data.back,
          type: (data.type as any) || 'basic',
          hint: data.hint,
          explanation: data.explanation,
          choices: data.choices || [],
          tags: data.tags || [],
          position: count,
          contentHash: hash,
        },
      });
      return card;
    } catch {
      const deck = inMemoryDecks.find((d) => d.id === deckId);
      if (!deck) throw new Error('Deck not found');
      if (!deck.cards) deck.cards = [];
      const newCard = {
        id: `card-${Date.now()}`,
        deckId,
        front: data.front,
        back: data.back,
        type: data.type || 'basic',
        hint: data.hint,
        explanation: data.explanation,
        choices: data.choices || [],
        tags: data.tags || [],
        position: deck.cards.length,
        contentHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      deck.cards.push(newCard);
      deck.cardCount = deck.cards.length;
      deck.dueToday = deck.cards.length;
      return newCard;
    }
  },

  async deleteCard(cardId: string): Promise<boolean> {
    try {
      await prisma.card.delete({ where: { id: cardId } });
      return true;
    } catch {
      for (const deck of inMemoryDecks) {
        if (deck.cards) {
          const idx = deck.cards.findIndex((c) => c.id === cardId);
          if (idx !== -1) {
            deck.cards.splice(idx, 1);
            deck.cardCount = deck.cards.length;
            deck.dueToday = Math.min(deck.dueToday, deck.cardCount);
            return true;
          }
        }
      }
      return false;
    }
  },
};
