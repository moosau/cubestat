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
        <div className="grid md:grid-cols-2 gap-4 p-6 w-full max-w-4xl mx-auto">
            {/* Fastest This Week */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Trophy className="h-5 w-5 text-foreground/60" /> Fastest This Week
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-2">
                        {weekly.length === 0 && (
                            <div className="text-sm text-muted-foreground py-4 text-center">No solves this week yet.</div>
                        )}
                        {weekly.map((entry, i) => (
                            <li
                                key={entry.userId}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 0 ? "bg-muted" : "hover:bg-muted/50"} transition-colors`}
                            >
                                <span className={`text-sm font-bold w-6 text-center tabular-nums ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                    {i + 1}
                                </span>
                                <Avatar className="h-7 w-7">
                                    {entry.avatarUrl ? (
                                        <img src={entry.avatarUrl} alt={entry.name} />
                                    ) : (
                                        <AvatarFallback className="text-xs">{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    )}
                                </Avatar>
                                <span className="font-medium text-sm flex-1 truncate">{entry.name}</span>
                                <span className="font-mono text-sm font-semibold tabular-nums">{formatTime(entry.bestTime)}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
            {/* Fastest Overall */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Trophy className="h-5 w-5 text-foreground/60" /> Fastest Overall
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-2">
                        {overall.length === 0 && (
                            <div className="text-sm text-muted-foreground py-4 text-center">No solves yet.</div>
                        )}
                        {overall.map((entry, i) => (
                            <li
                                key={entry.userId}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${i === 0 ? "bg-muted" : "hover:bg-muted/50"} transition-colors`}
                            >
                                <span className={`text-sm font-bold w-6 text-center tabular-nums ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                    {i + 1}
                                </span>
                                <Avatar className="h-7 w-7">
                                    {entry.avatarUrl ? (
                                        <img src={entry.avatarUrl} alt={entry.name} />
                                    ) : (
                                        <AvatarFallback className="text-xs">{entry.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    )}
                                </Avatar>
                                <span className="font-medium text-sm flex-1 truncate">{entry.name}</span>
                                <span className="font-mono text-sm font-semibold tabular-nums">{formatTime(entry.bestTime)}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}

export default LeaderboardView; 