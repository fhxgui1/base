"use client";

import { useState } from "react";
import { Problem } from "@/lib/types";
import { Plus, ListTodo, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import NewProblemDialog from "./new-problem-dialog";

export default function ProblemListClient({ problems }: { problems: Problem[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <ListTodo className="w-8 h-8 text-emerald-500" />
                    Meus Problemas
                </h1>
                <button
                    onClick={() => setIsDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Novo Problema</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {problems.map((problem) => (
                    <Link
                        key={problem.id}
                        href={`/problemas/${problem.id}`}
                        className="group p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium border",
                                    problem.status === "resolved"
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                        : problem.status === "in_progress"
                                            ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                )}
                            >
                                {problem.status === "resolved" ? "Resolvido" : problem.status === "in_progress" ? "Em Progresso" : "Aberto"}
                            </span>
                            <span className="text-xs text-zinc-400">
                                {new Date(problem.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {problem.title}
                        </h3>

                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {problem.description || "Sem descrição"}
                        </p>
                    </Link>
                ))}
                {problems.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <p>Nenhum problema registrado ainda.</p>
                    </div>
                )}
            </div>

            {isDialogOpen && <NewProblemDialog onClose={() => setIsDialogOpen(false)} />}
        </>
    );
}
