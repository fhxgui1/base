"use client";

import { Habit, HistoryRecord } from "@/lib/types";
import {
    Droplet,
    Dumbbell,
    Book,
    Brain,
    CheckCircle2,
    Circle,
    Activity,
    Moon,
    Sparkles,
    Utensils,
    Rocket,
    SprayCan, // using generic names, will fix imports if needed
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptimistic, startTransition } from "react";
import { toggleHabit } from "@/lib/data";

// Map icons string to components
// We'll add more icons to support the new list
const iconMap: Record<string, any> = {
    droplet: Droplet,
    dumbbell: Dumbbell,
    book: Book,
    brain: Brain,
    moon: Moon,
    sparkles: Sparkles,
    utensils: Utensils,
    rocket: Rocket,
    trash: Trash2,
};

interface HabitsClientProps {
    habits: Habit[];
    history: HistoryRecord[];
    today: string;
}

export default function HabitsClient({ habits, history, today }: HabitsClientProps) {
    // Optimistic UI for immediate feedback
    const [optimisticHistory, addOptimisticHistory] = useOptimistic<HistoryRecord[], string>(
        history,
        (currentState, habitId) => {
            const isDone = currentState.some(
                (h) => h.habitId === habitId && h.date === today
            );

            if (isDone) {
                return currentState.filter(
                    (h) => !(h.habitId === habitId && h.date === today)
                );
            } else {
                return [
                    ...currentState,
                    {
                        id: "temp-" + Math.random(),
                        habitId,
                        date: today,
                        completedAt: new Date().toISOString(),
                    },
                ];
            }
        }
    );

    const handleToggle = async (habitId: string) => {
        startTransition(() => {
            addOptimisticHistory(habitId);
        });
        // Call server action
        try {
            await toggleHabit(habitId);
        } catch (error) {
            console.error("Failed to toggle habit", error);
            // In a real app, you'd rollback the optimistic update here or show a toast
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {habits.map((habit) => {
                const isDone = optimisticHistory.some(
                    (h) => h.habitId === habit.id && h.date === today
                );
                const Icon = iconMap[habit.icon || "activity"] || Activity;

                return (
                    <div
                        key={habit.id}
                        onClick={() => handleToggle(habit.id)}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 cursor-pointer border",
                            isDone
                                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 shadow-sm"
                                : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/30"
                        )}
                    >
                        {/* Background Pattern for "Done" state */}
                        {isDone && (
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl" />
                            </div>
                        )}

                        <div className="relative flex items-start gap-4">
                            <div
                                className={cn(
                                    "p-3 rounded-xl transition-colors duration-300",
                                    isDone
                                        ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none"
                                        : "bg-zinc-100 text-zinc-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-emerald-900/30 dark:group-hover:text-emerald-400"
                                )}
                            >
                                <Icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h3
                                        className={cn(
                                            "font-semibold text-lg transition-colors",
                                            isDone
                                                ? "text-emerald-900 dark:text-emerald-100"
                                                : "text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                                        )}
                                    >
                                        {habit.name}
                                    </h3>
                                    {isDone ? (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-[bounce_0.5s_ease-out]" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                                    )}
                                </div>
                                <p
                                    className={cn(
                                        "text-sm leading-relaxed",
                                        isDone
                                            ? "text-emerald-700/80 dark:text-emerald-200/60"
                                            : "text-zinc-500 dark:text-zinc-400"
                                    )}
                                >
                                    {habit.description}
                                </p>
                            </div>
                        </div>

                        {/* Status Text Indicator */}
                        <div className="mt-4 flex items-center gap-2">
                            <span
                                className={cn(
                                    "text-xs font-medium px-2.5 py-1 rounded-full border",
                                    isDone
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300"
                                        : "bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/20 dark:group-hover:border-emerald-800 dark:group-hover:text-emerald-400"
                                )}
                            >
                                {isDone ? "Concluído hoje" : "Pendente"}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
