import { getProblem } from "@/lib/data";
import ProblemDetailClient from "./problem-detail-client";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProblemDetailPage({ params }: PageProps) {
    const { id } = await params;
    const problem = await getProblem(id);

    if (!problem) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto">
                <ProblemDetailClient problem={problem} />
            </div>
        </div>
    );
}
