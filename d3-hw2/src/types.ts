export type NBA1515Col =
    | "player_name"
    | "team_abbreviation"
    | "age"
    | "draft_number"
    | "gp"
    | "pts"
    | "reb"
    | "ast"
    | "umapX"
    | "umapY"
    | "ptsNorm"
    | "rebNorm"
    | "astNorm";

export type TeamLocCol = "team_abbreviation" | "lon" | "lat";

export type Player = {
    key: string;
    player_name: string | undefined;
    team_abbreviation: string | undefined;
    age: number;
    draft_number: number;
    gp: number;
    pts: number;
    reb: number;
    ast: number;
    umapX: number;
    umapY: number;
    ptsNorm: number;
    rebNorm: number;
    astNorm: number;
};

export type Loc = {
    team_abbreviation: string | undefined;
    lon: number;
    lat: number;
};

export interface ProcessedTeam {
    name: string;
    players: (Player & {
        key: string;
    })[];
    location: {
        lon: number;
        lat: number;
    };
}

export type Teams = Map<string, ProcessedTeam>;

export interface State {
    filter: {
        pts: null | [number, number];
        reb: null | [number, number];
        ast: null | [number, number];
        age: null | [number, number];
        gp: null | [number, number];
        draft_number: null | [number, number];
    };
    selected: null | Set<string>;
    filtered: Set<string>;
}
