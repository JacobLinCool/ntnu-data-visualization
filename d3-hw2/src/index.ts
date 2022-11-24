import { load_data } from "./load";
import { append_block } from "./utils";
import { preprocess } from "./preprocess";
import { Scatterplot, GeoMap, BarChart } from "./component";
import { State } from "./types";
import { Event } from "./event";

main();

async function main() {
    const data = await load_data();
    const teams = preprocess(data.nba, data.loc);
    const players = [...teams.values()].map((team) => team.players).flat();
    console.log(teams);

    let selected: Set<string> | null = null;
    const listeners: ((selected: Set<string> | null) => void)[] = [];
    const update = function (keys: Set<string> | null) {
        selected = keys;
        for (const listener of listeners) {
            listener(selected);
        }
    };

    const state: State = {
        filter: {
            pts: null,
            reb: null,
            ast: null,
            age: null,
            gp: null,
            draft_number: null,
        },
        selected: null,
        filtered: new Set(),
    };

    const event = new Event();
    event.on("update", console.log);

    const updater = function (new_state: State) {
        state.filter = new_state.filter;
        state.selected = new_state.selected;

        state.filtered = new Set(
            players
                .filter((d) => {
                    for (const key in state.filter) {
                        if (
                            state.filter[key] &&
                            (d[key] < state.filter[key][0] || d[key] > state.filter[key][1])
                        ) {
                            return false;
                        }
                    }
                    return true;
                })
                .map((d) => d.key)
        );
        event.emit("update", state);
    };

    const scatterplot = new Scatterplot(append_block("scatterplot"), players);
    scatterplot.elm.style.width = "35%";
    scatterplot.init(state, updater);
    event.on("update", (state: State) => scatterplot.update(state));

    const map = new GeoMap(append_block("map"), teams, data.map);
    map.elm.style.width = "65%";
    map.elm.style.left = "35%";
    map.init(state, updater);
    event.on("update", (state: State) => map.update(state));

    const bar_types = [
        ["pts", "reb", "ast"],
        ["age", "gp", "draft_number"],
    ] as const;
    for (let i = 0; i < bar_types.length; i++) {
        for (let j = 0; j < bar_types[i].length; j++) {
            const type = bar_types[i][j];
            const chart = new BarChart(append_block(`bar_${type}`), players, type);
            chart.elm.style.width = "25%";
            chart.elm.style.left = `${2 + j * 33}%`;
            chart.elm.style.top = (59 + 20 * i).toString() + "%";
            chart.init(state, updater);
            event.on("update", (state: State) => chart.update(state));
        }
    }
}
