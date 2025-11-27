import { LeagueLeaderboardView } from "@/components/leaderboard/LeagueLeaderboardView";

interface LeaderboardPageProps {
  params: { id: string };
}

export default function LeagueLeaderboardPage({ params }: LeaderboardPageProps) {
  return <LeagueLeaderboardView leagueId={params.id} />;
}