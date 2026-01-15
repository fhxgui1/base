"use server";

import { Pool } from "pg";
import { Habit, HistoryRecord, Problem, ProblemStep } from "./types";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initial seed data based on user request
const SEED_HABITS: Habit[] = [
    { id: "1", name: "Dormir Certo", description: "Ter uma boa noite de sono consistente", icon: "moon" },
    { id: "2", name: "Fazer Exercícios", description: "Atividade física para fortalecer o corpo", icon: "dumbbell" },
    { id: "3", name: "Cuidar dos Pensamentos", description: "Meditação e mindfulness", icon: "brain" },
    { id: "4", name: "Cuidar da Aparência", description: "Auto-cuidado e higiene pessoal", icon: "sparkles" },
    { id: "5", name: "Comer Bem", description: "Alimentação saudável e nutritiva", icon: "utensils" },
    { id: "6", name: "Estudar", description: "Aprender algo novo e evoluir", icon: "book" },
    { id: "7", name: "Pensar no Futuro", description: "Planejamento e visão de longo prazo", icon: "rocket" },
    { id: "8", name: "Limpar Algo", description: "Organização e limpeza do ambiente", icon: "trash" },
];

let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });
}

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;


async function ensureTables() {
    if (!pool) return;


    await pool.query(`
    CREATE TABLE IF NOT EXISTS base_habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS base_history (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES base_habits(id),
      date TEXT NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW()
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS problem_steps (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'pending', 
      observations TEXT,
      completed_at TIMESTAMP
    );
  `);

    // Add status column if it doesn't exist (migrations-like)
    await pool.query(`
        ALTER TABLE problem_steps 
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    `);


    const { rows } = await pool.query("SELECT COUNT(*) FROM base_habits");
    if (parseInt(rows[0].count) === 0) {
        for (const habit of SEED_HABITS) {
            await pool.query(
                "INSERT INTO base_habits (id, name, description, icon) VALUES ($1, $2, $3, $4)",
                [habit.id, habit.name, habit.description, habit.icon]
            );
        }
    }
}

export async function getHabits(): Promise<Habit[]> {
    if (!pool) {
        console.warn("Database URL not set, returning mock data");
        return SEED_HABITS;
    }

    try {
        await ensureTables();
        const { rows } = await pool.query("SELECT * FROM base_habits ORDER BY id ASC");
        return rows;
    } catch (error) {
        console.error("Database error fetching habits:", error);
        return SEED_HABITS;
    }
}

export async function getHistory(date: string): Promise<HistoryRecord[]> {
    if (!pool) {
        return [];
    }

    try {
        await ensureTables();
        const { rows } = await pool.query(
            "SELECT id, habit_id as \"habitId\", date, completed_at as \"completedAt\" FROM base_history WHERE date = $1",
            [date]
        );

        return rows.map(row => ({
            ...row,
            completedAt: row.completedAt.toISOString ? row.completedAt.toISOString() : row.completedAt
        }));
    } catch (error) {
        console.error("Database error fetching base_history:", error);
        return [];
    }
}

export async function toggleHabit(habitId: string) {
    if (!pool) return;

    const today = new Date().toISOString().split("T")[0];

    try {
        const { rows } = await pool.query(
            "SELECT id FROM base_history WHERE habit_id = $1 AND date = $2",
            [habitId, today]
        );

        if (rows.length > 0) {
            // Delete (Undo)
            await pool.query(
                "DELETE FROM base_history WHERE habit_id = $1 AND date = $2",
                [habitId, today]
            );
        } else {
            // Insert (Do)
            const id = Math.random().toString(36).substr(2, 9);
            await pool.query(
                "INSERT INTO base_history (id, habit_id, date) VALUES ($1, $2, $3)",
                [id, habitId, today]
            );
        }

        revalidatePath("/habitos");
    } catch (error) {
        console.error("Error toggling habit:", error);
        throw error;
    }
}

// PROBLEMS API

export async function getProblems(): Promise<Problem[]> {
    if (!pool) return [];
    try {
        await ensureTables();
        const { rows } = await pool.query("SELECT * FROM problems ORDER BY created_at DESC");
        return rows.map(row => ({
            ...row,
            createdAt: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at,
            steps: [] // Fetched separately or joined if needed, but simple for now
        }));
    } catch (error) {
        console.error("Error fetching problems:", error);
        return [];
    }
}

export async function getProblem(id: string): Promise<Problem | null> {
    if (!pool) return null;
    try {
        await ensureTables();
        const { rows } = await pool.query("SELECT * FROM problems WHERE id = $1", [id]);
        if (rows.length === 0) return null;

        const problem = rows[0];

        // Fetch steps
        const stepsResult = await pool.query("SELECT id, problem_id as \"problemId\", description, completed, status, observations, completed_at as \"completedAt\" FROM problem_steps WHERE problem_id = $1 ORDER BY id ASC", [id]);

        return {
            ...problem,
            createdAt: problem.created_at.toISOString ? problem.created_at.toISOString() : problem.created_at,
            steps: stepsResult.rows.map(step => ({
                ...step,
                status: step.status || (step.completed ? 'completed' : 'pending'), // Fallback for existing rows
                completedAt: step.completedAt?.toISOString ? step.completedAt.toISOString() : step.completedAt
            }))
        };
    } catch (error) {
        console.error("Error fetching problem:", error);
        return null;
    }
}

export async function createProblem(title: string, description: string) {
    if (!pool) return;
    try {
        const id = Math.random().toString(36).substr(2, 9);
        await pool.query(
            "INSERT INTO problems (id, title, description) VALUES ($1, $2, $3)",
            [id, title, description]
        );
        revalidatePath("/problemas");
        return id;
    } catch (error) {
        console.error("Error creating problem:", error);
        throw error;
    }
}

export async function createProblemStep(problemId: string, description: string, observations: string = "") {
    if (!pool) return;
    try {
        const id = Math.random().toString(36).substr(2, 9);
        await pool.query(
            "INSERT INTO problem_steps (id, problem_id, description, observations, status) VALUES ($1, $2, $3, $4, 'pending')",
            [id, problemId, description, observations]
        );
        revalidatePath(`/problemas/${problemId}`);
        return id;
    } catch (error) {
        console.error("Error creating problem step:", error);
        throw error;
    }
}

export async function updateProblemStep(stepId: string, status: string, observations: string) {
    if (!pool) return;
    try {
        const completed = status === 'completed';
        if (completed) {
            await pool.query(
                "UPDATE problem_steps SET completed = $1, status = $2, observations = $3, completed_at = NOW() WHERE id = $4",
                [true, status, observations, stepId]
            );
        } else {
            await pool.query(
                "UPDATE problem_steps SET completed = $1, status = $2, observations = $3, completed_at = NULL WHERE id = $4",
                [false, status, observations, stepId]
            );
        }

        // Revalidate is tricky because we don't know the problem ID here easily without a fetch, 
        // but usually the client knows. We'll do a general revalidate or assume the page will handle it.
        // Ideally we would return the problemId.
        const { rows } = await pool.query("SELECT problem_id FROM problem_steps WHERE id = $1", [stepId]);
        if (rows.length > 0) {
            revalidatePath(`/problemas/${rows[0].problem_id}`);
        }

    } catch (error) {
        console.error("Error updating problem step:", error);
        throw error;
    }
}

export async function updateProblemStatus(problemId: string, status: string) {
    if (!pool) return;
    try {
        await pool.query(
            "UPDATE problems SET status = $1 WHERE id = $2",
            [status, problemId]
        );
        revalidatePath(`/problemas/${problemId}`);
        revalidatePath("/problemas");
    } catch (error) {
        console.error("Error updating problem status:", error);
        throw error;
    }
}

export async function updateProblemDescription(problemId: string, description: string) {
    if (!pool) return;
    try {
        await pool.query(
            "UPDATE problems SET description = $1 WHERE id = $2",
            [description, problemId]
        );
        revalidatePath(`/problemas/${problemId}`);
    } catch (error) {
        console.error("Error updating problem description:", error);
        throw error;
    }
}

export async function getProblemSuggestion(formData: FormData): Promise<string> {
    if (!genAI) {
        console.log("Gemini API Key not found");
        return "";
    }

    const audioFile = formData.get("audio") as File;
    if (!audioFile) return "";

    try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            "Transcreva o áudio e gere uma sugestão curta de resolução (max 2 frases) para o problema descrito. Retorne apenas o texto da sugestão.",
            {
                inlineData: {
                    mimeType: audioFile.type || "audio/webm",
                    data: base64Audio
                }
            }
        ]);

        return result.response.text();
    } catch (error) {
        console.error("Error generating suggestion:", error);
        return "";
    }
}