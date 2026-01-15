"use client";

import { useState } from "react";
import { updateProblemStep } from "@/lib/data";
import { X, CheckCircle2, Circle, Loader2, PlayCircle, Clock } from "lucide-react";
import { ProblemStep } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface StepDialogProps {
    step: ProblemStep;
    onClose: () => void;
}

export default function StepDialog({ step, onClose }: StepDialogProps) {
    const [status, setStatus] = useState<"pending" | "in_progress" | "completed">(step.status || (step.completed ? "completed" : "pending"));
    const [observations, setObservations] = useState(step.observations || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProblemStep(step.id, status, observations);
            router.refresh();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to update step");
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { id: 'pending', label: 'Pendente', icon: Circle, color: 'text-zinc-500', bg: 'bg-zinc-100 dark:bg-zinc-800' },
        { id: 'in_progress', label: 'Em Progresso', icon: PlayCircle, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' },
        { id: 'completed', label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Detalhes do Passo
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">
                            Descrição
                        </h3>
                        <p className="text-lg text-zinc-900 dark:text-zinc-100">
                            {step.description}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider">
                            Status
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {statusOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = status === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setStatus(option.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium",
                                            isSelected
                                                ? `border-transparent ring-2 ring-offset-1 dark:ring-offset-zinc-900 ${option.bg} ${option.color} ring-current`
                                                : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4", isSelected ? "fill-current/20" : "")} />
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {step.completedAt && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg w-fit">
                            <Clock className="w-3 h-3" />
                            Concluído em: {new Date(step.completedAt).toLocaleString()}
                        </p>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Observações
                        </label>
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Adicione notas sobre a execução deste passo..."
                            rows={4}
                            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
