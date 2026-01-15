"use client";

import { useState, useRef } from "react";
import { createProblem, getProblemSuggestion } from "@/lib/data";
import { Plus, X, Loader2, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function NewProblemDialog({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [suggestionLoading, setSuggestionLoading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const router = useRouter();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            }

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setSuggestionLoading(true);
                try {
                    const formData = new FormData();
                    formData.append("audio", blob);
                    const suggestion = await getProblemSuggestion(formData);
                    if (suggestion) {
                        setDescription(prev => prev ? prev + "\n" + suggestion : suggestion);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setSuggestionLoading(false);
                    stream.getTracks().forEach(track => track.stop());
                }
            }

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error(e);
            alert("Erro ao acessar microfone");
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createProblem(title, description);
            setTitle("");
            setDescription("");
            onClose();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to create problem");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Novo Problema
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Título
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Arrumar a torneira"
                            className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Descrição
                            </label>
                            <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-all",
                                    isRecording
                                        ? "bg-red-100 text-red-600 animate-pulse"
                                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                                )}
                            >
                                {suggestionLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isRecording ? (
                                    <Square className="w-3 h-3 fill-current" />
                                ) : (
                                    <Mic className="w-3 h-3" />
                                )}
                                {suggestionLoading ? "Gerando..." : isRecording ? "Parar" : "Gravar Sugestão"}
                            </button>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o problema..."
                            disabled={suggestionLoading}
                            rows={3}
                            className="w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Criar Problema
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
