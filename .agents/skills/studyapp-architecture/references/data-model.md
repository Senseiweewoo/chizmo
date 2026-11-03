# Data model sketch (Prisma-style)

```prisma
model User { id String @id @default(cuid()) email String? @unique displayName String
  birthYear Int? isGuest Boolean @default(true) timezone String @default("UTC")
  dayRolloverHour Int @default(4) createdAt DateTime @default(now()) }

model Deck { id String @id @default(cuid()) ownerId String title String description String?
  visibility Visibility @default(PRIVATE) language String @default("en") folderId String?
  forkedFromId String? sourceId String? createdAt DateTime @default(now())
  @@index([ownerId]) }

model Card { id String @id @default(cuid()) deckId String type CardType
  front String back String hint String? explanation String? sourceRef Json? tags String[]
  difficultyEstimate Int? position Int createdBy CreatedBy @default(AI)
  contentHash String
  @@index([deckId]) @@index([contentHash]) }

model CardState { userId String cardId String
  state LearnState @default(NEW) stability Float? difficulty Float?
  due DateTime lastReview DateTime? reps Int @default(0) lapses Int @default(0)
  @@id([userId, cardId]) @@index([userId, due]) }

model ReviewLog { id String @id @default(cuid()) userId String cardId String
  rating Int  // 1 Again, 2 Hard, 3 Good, 4 Easy
  prevState LearnState elapsedDays Float scheduledDays Float responseMs Int?
  reviewedAt DateTime @default(now())
  @@index([userId, reviewedAt]) @@index([cardId]) }

model Source { id String @id @default(cuid()) userId String type SourceType url String?
  fileKey String? status SourceStatus extractedText String? error String?
  settings Json createdAt DateTime @default(now()) }

model StreakDay { userId String date DateTime xp Int reviews Int @@id([userId, date]) }
model LiveRoom { id String @id code String @unique hostId String deckId String
  status RoomStatus settings Json createdAt DateTime @default(now()) }
```
Also: Profile, Subscription, Entitlement, Quiz, QuizQuestion, QuizAttempt, Summary, TutorThread,
TutorMessage, Achievement, UserAchievement, Friend, LeaderboardEntry, LivePlayer, LiveAnswer,
Notification, ShareLink, Report, AuditLog, ImportJob.

Indexes to add early: `CardState(userId, due)` for the daily queue, `ReviewLog(userId, reviewedAt)`
for analytics, `Card(contentHash)` for dedupe, weekly leaderboard key in Redis (sorted set), not SQL.
