import { Player, Loc } from "./types";
import { random_key } from "./utils";

export function preprocess(players: Omit<Player, "key">[], locs: Loc[]) {
    const teams = new Map<
        string,
        {
            name: string;
            players: Player[];
            location: {
                lon: number;
                lat: number;
            };
        }
    >();

    for (const loc of locs) {
        if (loc.team_abbreviation) {
            teams.set(loc.team_abbreviation, {
                name: loc.team_abbreviation,
                players: [],
                location: {
                    lon: loc.lon,
                    lat: loc.lat,
                },
            });
        }
    }

    for (const player of players) {
        if (player.team_abbreviation) {
            teams.get(player.team_abbreviation)?.players.push({
                key: random_key(),
                ...player,
            });
        }
    }

    return teams;
}
