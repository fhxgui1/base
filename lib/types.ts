export type Habit = {
    id: string;
    name: string;
    description: string;
    icon?: string;
};

export type HistoryRecord = {
    id: string;
    habitId: string;
    date: string; // YYYY-MM-DD
    completedAt: string; // ISO Date
};

export type ProblemStep = {
    id: string;
    problemId: string;
    description: string;
    completed: boolean; // Kept for backward compat, but we'll prefer status
    status: "pending" | "in_progress" | "completed";
    observations?: string;
    completedAt?: string;
};

export type Problem = {
    id: string;
    title: string;
    description: string;
    status: "open" | "in_progress" | "resolved";
    createdAt: string;
    steps: ProblemStep[];
};
