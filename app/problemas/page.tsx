import { getProblems } from "@/lib/data";
import ProblemListClient from "./problem-list-client";

export const dynamic = 'force-dynamic';

export default async function ProblemasPage() {
    const problems = await getProblems();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <ProblemListClient problems={problems} />
            </div>
        </div>
    );
}
