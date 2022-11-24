import * as d3 from "d3";
import { ExtendedFeatureCollection } from "d3";
import { NBA1515Col, TeamLocCol } from "./types";

export async function load_data() {
    return {
        nba: (await d3.csv<NBA1515Col>("NBA1516.csv")).map((d) => ({
            player_name: d.player_name,
            team_abbreviation: d.team_abbreviation,
            age: Number(d.age),
            draft_number: d.draft_number === "Undrafted" ? 65 : Number(d.draft_number),
            gp: Number(d.gp),
            pts: Number(d.pts),
            reb: Number(d.reb),
            ast: Number(d.ast),
            umapX: Number(d.umapX),
            umapY: Number(d.umapY),
            ptsNorm: Number(d.ptsNorm),
            rebNorm: Number(d.rebNorm),
            astNorm: Number(d.astNorm),
        })),
        loc: (await d3.csv<TeamLocCol>("TeamLoc.csv")).map((d) => ({
            team_abbreviation: d.team_abbreviation,
            lon: Number(d.lon),
            lat: Number(d.lat),
        })),
        map: (await d3.json("us-states.json")) as ExtendedFeatureCollection,
    };
}
