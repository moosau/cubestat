import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface LeaderboardEntry {
    userId: string;
    name: string;
    avatarUrl?: string;
    bestTime: number;
}

interface LeaderboardViewProps {
    weekly: LeaderboardEntry[];
    overall: LeaderboardEntry[];
}

function formatTime(ms: number) {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return min > 0
        ? `${min}:${sec.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`
        : `${sec}.${cs.toString().padStart(2, "0")}`;
}

function ordinal(n: number) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function LeaderboardView({ weekly, overall }: LeaderboardViewProps) {
    return (
        <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Fastest This Week */}
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-500">
                        <Trophy className="h-6 w-6 text-yellow-400" /> Fastest This Week
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        {weekly.length === 0 && <div className="text-muted-foreground">No solves this week yet.</div>}
                        {weekly.map((entry, i) => (
                            <li key={entry.userId} className={`flex items-center gap-4 p-2 rounded-lg ${i === 0 ? "bg-blue-100/30" : ""}`}>
                                <span className="text-2xl font-bold w-10 text-center">{ordinal(i + 1)}</span>
                                <Avatar>
                                    {entry.avatarUrl ? (
                                        <img src={entry.avatarUrl} alt={entry.name} />
                                    ) : (
                                        <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    )}
                                </Avatar>
                                <span className="font-semibold flex-1">{entry.name}</span>
                                <span className="font-mono text-lg text-blue-600">{formatTime(entry.bestTime)}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
            {/* Fastest Overall */}
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                        <Trophy className="h-6 w-6 text-yellow-400" /> Fastest Overall
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        {overall.length === 0 && <div className="text-muted-foreground">No solves yet.</div>}
                        {overall.map((entry, i) => (
                            <li key={entry.userId} className={`flex items-center gap-4 p-2 rounded-lg ${i === 0 ? "bg-green-100/30" : ""}`}>
                                <span className="text-2xl font-bold w-10 text-center">{ordinal(i + 1)}</span>
                                <Avatar>
                                    {entry.avatarUrl ? (
                                        <img src={entry.avatarUrl} alt={entry.name} />
                                    ) : (
                                        <AvatarFallback>{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    )}
                                </Avatar>
                                <span className="font-semibold flex-1">{entry.name}</span>
                                <span className="font-mono text-lg text-green-600">{formatTime(entry.bestTime)}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}

export default LeaderboardView; 