import { getHabits, getHistory } from "@/lib/data";
import HabitsClient from "./habits-client";

export const dynamic = 'force-dynamic'; // Ensure new data is fetched on every render

export default async function HabitosPage() {
    const habits = await getHabits();

    // Get today's date in YYYY-MM-DD format (Server Time)
    // Note: ensure this matches the logic in toggleHabit (lib/data.ts)
    const today = new Date().toISOString().split("T")[0];

    const history = await getHistory(today);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        Hábitos de Base
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                        Registre e acompanhe suas conquistas diárias.
                    </p>
                </header>

                <HabitsClient habits={habits} history={history} today={today} />
            </div>
        </div>
    );
}
