"use client";

import { useState } from "react";
import { createProblemStep, updateProblemStatus, updateProblemDescription } from "@/lib/data";
import { Problem, ProblemStep } from "@/lib/types";
import {
    ArrowLeft,
    Plus,
    CheckCircle2,
    Circle,
    CheckCheck,
    MoreVertical,
    Loader2,
    Pencil,
    Save,
    X as XIcon,
    PlayCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import StepDialog from "@/components/step-dialog";

export default function ProblemDetailClient({ problem }: { problem: Problem }) {
    const [isAddingStep, setIsAddingStep] = useState(false);
    const [newStepText, setNewStepText] = useState("");
    const [newStepObservations, setNewStepObservations] = useState("");
    const [addingLoading, setAddingLoading] = useState(false);
    const [selectedStep, setSelectedStep] = useState<ProblemStep | null>(null);

    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [currentDesc, setCurrentDesc] = useState(problem.description || "");
    const [descLoading, setDescLoading] = useState(false);

    const router = useRouter();

    const handleAddStep = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStepText.trim()) return;

        setAddingLoading(true);
        try {
            await createProblemStep(problem.id, newStepText, newStepObservations);
            setNewStepText("");
            setNewStepObservations("");
            setIsAddingStep(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar passo");
        } finally {
            setAddingLoading(false);
        }
    };

    const handleSaveDesc = async () => {
        setDescLoading(true);
        try {
            await updateProblemDescription(problem.id, currentDesc);
            setIsEditingDesc(false);
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar descrição");
        } finally {
            setDescLoading(false);
        }
    }

    const completedSteps = problem.steps.filter(s => s.completed).length;
    const totalSteps = problem.steps.length;
    const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateProblemStatus(problem.id, newStatus);
            router.refresh();
        } catch (e) {
            console.error(e);
        }
    }

    const [activeTab, setActiveTab] = useState<"all" | "pending" | "in_progress" | "completed">("all");

    const filteredSteps = problem.steps.filter((step) => {
        if (activeTab === "all") return true;
        if (activeTab === "completed") return step.status === 'completed' || step.completed; // fallback
        if (activeTab === "in_progress") return step.status === 'in_progress';
        if (activeTab === "pending") return !step.status || step.status === 'pending';
        return true;
    });

    const getStatusIcon = (status: string | undefined, completed: boolean) => {
        if (status === 'completed' || completed) return CheckCircle2;
        if (status === 'in_progress') return PlayCircle;
        return Circle;
    }

    const getStatusColor = (status: string | undefined, completed: boolean) => {
        if (status === 'completed' || completed) return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900 border-emerald-500";
        if (status === 'in_progress') return "text-blue-500 bg-blue-100 dark:bg-blue-900 border-blue-500";
        return "text-zinc-300 dark:text-zinc-600 border-zinc-300 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400";
    }

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <Link
                        href="/problemas"
                        className="inline-flex items-center text-sm text-zinc-500 hover:text-emerald-600 transition-colors bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 w-fit shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar para lista
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 max-w-2xl w-full">
                            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                                {problem.title}
                            </h1>

                            {isEditingDesc ? (
                                <div className="flex gap-2 items-start animate-in fade-in">
                                    <textarea
                                        value={currentDesc}
                                        onChange={(e) => setCurrentDesc(e.target.value)}
                                        className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y min-h-[100px]"
                                        placeholder="Descrição do problema..."
                                    />
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={handleSaveDesc}
                                            disabled={descLoading}
                                            className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors disabled:opacity-50"
                                        >
                                            {descLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingDesc(false);
                                                setCurrentDesc(problem.description || "");
                                            }}
                                            className="p-2 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group relative">
                                    <p className="text-lg text-zinc-500 dark:text-zinc-400 pr-8">
                                        {problem.description || "Sem descrição"}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsEditingDesc(true);
                                            setCurrentDesc(problem.description || "");
                                        }}
                                        className="absolute right-0 top-1 p-1 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm self-start">
                            {(['open', 'in_progress', 'resolved'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        problem.status === status
                                            ? status === 'resolved'
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 shadow-sm"
                                                : status === 'in_progress'
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-sm"
                                                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-sm"
                                            : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                    )}
                                >
                                    {status === 'resolved' ? 'Resolvido' : status === 'in_progress' ? 'Em Progresso' : 'Aberto'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Progresso</span>
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-zinc-500 text-right">
                        {completedSteps} de {totalSteps} passos concluídos
                    </p>
                </div>

                {/* Steps Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <CheckCheck className="w-5 h-5 text-emerald-500" />
                            Passos para Resolução
                        </h2>
                        {!isAddingStep && (
                            <button
                                onClick={() => setIsAddingStep(true)}
                                className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Passo
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-full md:w-fit">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'pending', label: 'Pendentes' },
                            { id: 'in_progress', label: 'Em Andamento' },
                            { id: 'completed', label: 'Concluídos' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {isAddingStep && (
                        <form onSubmit={handleAddStep} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in slide-in-from-top-2 space-y-3">
                            <div className="space-y-1">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newStepText}
                                    onChange={(e) => setNewStepText(e.target.value)}
                                    placeholder="Título do passo..."
                                    className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <textarea
                                    value={newStepObservations}
                                    onChange={(e) => setNewStepObservations(e.target.value)}
                                    placeholder="Descrição detalhada ou observações (opcional)..."
                                    rows={2}
                                    className="w-full px-4 py-2 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingStep(false)}
                                    className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingLoading}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium text-sm flex items-center gap-2"
                                >
                                    {addingLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Salvar Passo
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="grid gap-3">
                        {filteredSteps.map((step) => {
                            const Icon = getStatusIcon(step.status, step.completed);
                            const colorClass = getStatusColor(step.status, step.completed);

                            return (
                                <div
                                    key={step.id}
                                    onClick={() => setSelectedStep(step)}
                                    className="group flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
                                        colorClass
                                    )}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className={cn(
                                                "font-medium transition-colors",
                                                (step.status === 'completed' || step.completed) ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-900 dark:text-zinc-100"
                                            )}>
                                                {step.description}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 mt-1">
                                            {(step.status === 'completed' || step.completed) && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-1">
                                                    Concluído {step.completedAt && `em ${new Date(step.completedAt).toLocaleDateString()}`}
                                                </span>
                                            )}
                                            {step.status === 'in_progress' && (
                                                <span className="text-xs text-blue-600 dark:text-blue-500 font-medium flex items-center gap-1">
                                                    Em andamento
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <MoreVertical className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            );
                        })}

                        {filteredSteps.length === 0 && !isAddingStep && (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                <p>Nenhum passo {activeTab !== 'all' ? 'com este status' : 'definido ainda'}.</p>
                                {activeTab === 'all' && (
                                    <button
                                        onClick={() => setIsAddingStep(true)}
                                        className="mt-2 text-emerald-600 hover:underline font-medium"
                                    >
                                        Comece adicionando o primeiro passo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedStep && (
                <StepDialog
                    step={selectedStep}
                    onClose={() => setSelectedStep(null)}
                />
            )}
        </>
    );
}
