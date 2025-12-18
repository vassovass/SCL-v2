import { LeagueLeaderboardView } from "@/components/leaderboard/LeagueLeaderboardView";

interface LeaderboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeagueLeaderboardPage({ params }: LeaderboardPageProps) {
  const { id } = await params;
  return <LeagueLeaderboardView leagueId={id} />;
}
