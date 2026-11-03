CREATE TYPE "session_status" AS ENUM ('lobby', 'question_open', 'question_closed', 'finished');

CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "owner_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "correct_answer" BOOLEAN NOT NULL,
    "image_path" TEXT,
    "time_limit_seconds" INTEGER NOT NULL DEFAULT 20,
    "order_index" INTEGER NOT NULL,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_sessions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID,
    "host_id" UUID NOT NULL,
    "host_name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "session_status" NOT NULL DEFAULT 'lobby',
    "current_question_index" INTEGER NOT NULL DEFAULT -1,
    "question_opened_at" TIMESTAMP(3),
    "question_closes_at" TIMESTAMP(3),
    "quiz_title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_questions" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "correct_answer" BOOLEAN NOT NULL,
    "image_path" TEXT,
    "time_limit_seconds" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    CONSTRAINT "session_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_players" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" BOOLEAN NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "points" INTEGER NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_sessions_code_key" ON "game_sessions"("code");
CREATE INDEX "quizzes_owner_id_idx" ON "quizzes"("owner_id");
CREATE INDEX "questions_quiz_id_order_index_idx" ON "questions"("quiz_id", "order_index");
CREATE INDEX "game_sessions_host_id_idx" ON "game_sessions"("host_id");
CREATE INDEX "session_questions_session_id_order_index_idx" ON "session_questions"("session_id", "order_index");
CREATE UNIQUE INDEX "session_players_session_id_user_id_key" ON "session_players"("session_id", "user_id");
CREATE UNIQUE INDEX "answers_session_id_question_id_user_id_key" ON "answers"("session_id", "question_id", "user_id");

ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "session_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
