import * as d3 from "d3";
import { Event } from "./event";
import { BaseType, ExtendedFeatureCollection, HistogramGeneratorNumber } from "d3";
import { Player, State, Teams } from "./types";

export class Component extends Event {
    constructor(public elm: HTMLDivElement) {
        super();
    }

    init(state: State, update: (state: State) => void): void {
        // console.log("init", this);
    }

    update(state: State): void {
        // console.log("updated", this);
    }
}

export class Scatterplot extends Component {
    public SIZE = 500;
    public PADDING = 50;
    private points?: d3.Selection<
        SVGCircleElement | BaseType,
        {
            cx: number;
            cy: number;
            r: number;
            fill: string;
            key: string;
            name: string;
            pts: number;
            reb: number;
            ast: number;
            age: number;
            gp: number;
            draft_number: number;
        },
        SVGGElement,
        unknown
    >;
    private brush?: d3.Selection<SVGGElement, unknown, null, undefined>;

    constructor(elm: HTMLDivElement, private data: Player[]) {
        super(elm);
    }

    public init(state: State, update: (state: State) => void): void {
        const X = {
            max: Math.max(...this.data.map((d) => d.umapX)),
            min: Math.min(...this.data.map((d) => d.umapX)),
        };

        const Y = {
            max: Math.max(...this.data.map((d) => d.umapY)),
            min: Math.min(...this.data.map((d) => d.umapY)),
        };

        const scatterplot = d3
            .select(this.elm)
            .append("svg")
            .attr("viewBox", `0 0 ${this.SIZE + this.PADDING * 2} ${this.SIZE + this.PADDING * 2}`)
            .style("width", "100%")
            .style("height", "100%");

        this.brush = scatterplot
            .append("g")
            .attr("class", "brush")
            .call(
                d3
                    .brush()
                    .on("brush", (evt) => {
                        const selection = evt.selection;
                        if (selection) {
                            const x0 = selection[0][0] - this.PADDING;
                            const y0 = selection[0][1] - this.PADDING;
                            const x1 = selection[1][0] - this.PADDING;
                            const y1 = selection[1][1] - this.PADDING;
                            const selected = players.filter(
                                (d) => d.cx >= x0 && d.cx <= x1 && d.cy >= y0 && d.cy <= y1
                            );
                            for (const f in state.filter) {
                                state.filter[f] = null;
                            }
                            state.selected = new Set(selected.map((d) => d.key));
                            update(state);
                        }
                    })
                    .on("end", (evt) => {
                        if (evt.selection === null) {
                            update({ ...state, selected: null });
                        }
                    })
            );

        const wrapper = scatterplot
            .append("g")
            .attr("transform", `translate(${this.PADDING}, ${this.PADDING})`);
        const points_wrapper = wrapper.append("g");
        const x_axis = wrapper.append("g");
        const y_axis = wrapper.append("g");
        const legends = wrapper.append("g");

        const x_scaler = d3.scaleLinear().domain([X.min, X.max]).range([0, this.SIZE]);
        const y_scaler = d3.scaleLinear().domain([Y.max, Y.min]).range([0, this.SIZE]);

        const axis_x = d3.axisBottom(x_scaler).tickFormat(() => "");
        const axis_y = d3.axisLeft(y_scaler).tickFormat(() => "");

        x_axis.attr("transform", `translate(0, ${this.SIZE})`).call(axis_x);
        y_axis.attr("transform", `translate(0, 0)`).call(axis_y);

        const color = { astNorm: "blue", ptsNorm: "red", rebNorm: "green" };

        const players = this.data.map((d) => ({
            cx: x_scaler(d.umapX),
            cy: y_scaler(d.umapY),
            r: (10 + d.astNorm + d.ptsNorm + d.rebNorm) / 3,
            fill: {
                [d.astNorm]: color.astNorm,
                [d.ptsNorm]: color.ptsNorm,
                [d.rebNorm]: color.rebNorm,
            }[[d.astNorm, d.ptsNorm, d.rebNorm].sort((a, b) => b - a)[0]],
            key: d.key,
            name: d.player_name || "",
            pts: d.pts,
            reb: d.reb,
            ast: d.ast,
            age: d.age,
            gp: d.gp,
            draft_number: d.draft_number,
        }));

        const tooltip = scatterplot
            .append("g")
            .style("opacity", 0)
            .style("pointer-events", "none")
            .style("transition", "all 0.2s");
        tooltip
            .append("rect")
            .attr("width", 200)
            .attr("height", 70)
            .attr("fill", "black")
            .style("opacity", 0.7)
            .style("rx", 5);
        tooltip.append("text").attr("x", 10).attr("y", 15).attr("fill", "white");
        tooltip
            .append("text")
            .attr("x", 10)
            .attr("y", 30)
            .attr("fill", "white")
            .attr("font-size", "0.8rem");
        tooltip
            .append("text")
            .attr("x", 10)
            .attr("y", 45)
            .attr("fill", "white")
            .attr("font-size", "0.8rem");
        tooltip
            .append("text")
            .attr("x", 10)
            .attr("y", 60)
            .attr("fill", "white")
            .attr("font-size", "0.8rem");

        this.points = points_wrapper.selectAll("circle").data(players).join("circle");
        this.points
            .attr("key", (d) => d.key)
            .attr("cx", (d) => d.cx)
            .attr("cy", (d) => d.cy)
            .attr("r", (d) => d.r)
            .style("fill", (d) => d.fill)
            .style("stroke", "black")
            .style("transition", "all 0.2s")
            .on("mouseover", (evt, d) => {
                let x = d.cx + this.PADDING - 100;
                if (x < 0) {
                    x = 0;
                }
                if (x > this.SIZE + this.PADDING * 2 - 200) {
                    x = this.SIZE + this.PADDING * 2 - 200;
                }

                let y = d.cy + this.PADDING - 80;
                if (y < 0) {
                    y = 0;
                }

                tooltip.style("opacity", 1).attr("transform", `translate(${x}, ${y})`);

                tooltip
                    .selectAll("text")
                    .data([d.name, `PTS: ${d.pts}`, `REB: ${d.reb}`, `AST: ${d.ast}`])
                    .text((d) => d);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        legends.attr("transform", `translate(10, 10)`);

        legends
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 100)
            .attr("height", 40)
            .style("fill", "white")
            .style("stroke", "gray");

        legends
            .append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 5)
            .style("fill", color.ptsNorm);
        legends.append("text").attr("x", 20).attr("y", 15).text("pts");

        legends
            .append("circle")
            .attr("cx", 10)
            .attr("cy", 30)
            .attr("r", 5)
            .style("fill", color.astNorm);
        legends.append("text").attr("x", 20).attr("y", 35).text("ast");

        legends
            .append("circle")
            .attr("cx", 60)
            .attr("cy", 10)
            .attr("r", 5)
            .style("fill", color.rebNorm);
        legends.append("text").attr("x", 70).attr("y", 15).text("reb");

        legends.append("text").attr("x", 55).attr("y", 35).text("r: ");
        legends.append("text").attr("x", 70).attr("y", 35).text("avg");

        super.init(state, update);
    }

    update(state: State): void {
        if (Object.values(state.filter).some((d) => d)) {
            this.brush?.call(d3.brush().move, null);
            const filtered = this.data.filter((d) => {
                for (const key in state.filter) {
                    if (
                        state.filter[key] &&
                        (d[key] < state.filter[key][0] || d[key] > state.filter[key][1])
                    ) {
                        return false;
                    }
                }
                return true;
            });
        }

        this.points?.style("stroke", (d) => (state.selected?.has(d.key) ? "yellow" : "black"));
        this.points?.style("opacity", (d) => (state.filtered.has(d.key) ? 1 : 0.5));

        super.update(state);
    }
}

export class GeoMap extends Component {
    public WIDTH = 700;
    public HEIGHT = 400;
    public PADDING = 30;
    private circles?: d3.Selection<
        SVGCircleElement,
        { x: number; y: number; team: string },
        SVGGElement,
        unknown
    >;

    constructor(elm: HTMLDivElement, private data: Teams, private map: ExtendedFeatureCollection) {
        super(elm);
    }

    public init(state: State, update: (state: State) => void): void {
        const svg = d3
            .select(this.elm)
            .append("svg")
            .attr(
                "viewBox",
                `0 0 ${this.WIDTH + this.PADDING * 2} ${this.HEIGHT + this.PADDING * 2}`
            )
            .style("width", "100%")
            .style("height", "100%");

        const wrapper = svg
            .append("g")
            .attr("transform", `translate(${this.PADDING}, ${this.PADDING})`);

        const painter = d3.geoPath().projection(
            d3.geoEquirectangular().fitExtent(
                [
                    [0, 0],
                    [this.WIDTH, this.HEIGHT],
                ],
                this.map
            )
        );

        wrapper
            .selectAll("path")
            .data(this.map.features)
            .enter()
            .append("path")
            .attr("d", painter)
            .style("fill", "white")
            .style("stroke", "black");

        const teams = [...this.data.values()].map((d) => {
            const [x, y] = painter.centroid({
                type: "Point",
                coordinates: [d.location.lon, d.location.lat],
            });
            return { x, y, team: d.name };
        });

        this.circles = wrapper.selectAll("circle").data(teams).enter().append("circle");
        this.circles
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => this.data.get(d.team)?.players.length ?? 0)
            .style("fill", "#ff000088")
            .style("stroke", "black")
            .style("transition", "all 0.2s");

        wrapper
            .selectAll("text")
            .data(teams)
            .enter()
            .append("text")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .text((d) => d.team || "");

        super.init(state, update);
    }

    public update(state: State): void {
        const filtering = Object.values(state.filter).some((d) => d);

        this.circles?.attr("r", (d) => {
            const team = this.data.get(d.team);
            if (team) {
                const players = team.players.filter((p) =>
                    state.selected
                        ? state.selected.has(p.key)
                        : filtering
                        ? state.filtered.has(p.key)
                        : true
                );
                return players.length;
            }
            return 0;
        });

        super.update(state);
    }
}

export class BarChart extends Component {
    public WIDTH = 500;
    public HEIGHT = 200;
    public PADDING = 30;
    private each: number;
    private transform: HistogramGeneratorNumber<number, number>;
    private y_scale: d3.ScaleLinear<number, number, never>;
    private bins?: d3.Selection<SVGRectElement, d3.Bin<number, number>, SVGGElement, unknown>;
    private brush?: d3.Selection<SVGGElement, unknown, null, undefined>;

    constructor(
        elm: HTMLDivElement,
        private players: Player[],
        private type: "pts" | "reb" | "ast" | "age" | "gp" | "draft_number"
    ) {
        super(elm);
        this.each = ["reb", "ast"].includes(this.type) ? 0.5 : this.type === "draft_number" ? 5 : 1;
    }

    public init(state: State, update: (state: State) => void): void {
        const nums = this.players.map((d) => d[this.type]);
        const max = Math.ceil(Math.max(...nums));
        const min = Math.floor(Math.min(...nums));

        const svg = d3
            .select(this.elm)
            .append("svg")
            .attr(
                "viewBox",
                `0 0 ${this.WIDTH + this.PADDING * 2} ${this.HEIGHT + this.PADDING * 2}`
            )
            .style("width", "100%")
            .style("height", "100%");

        const wrapper = svg
            .append("g")
            .attr("transform", `translate(${this.PADDING}, ${this.PADDING})`);

        const x_scale = d3.scaleLinear().domain([min, max]).range([0, this.WIDTH]);
        this.transform = d3
            .bin()
            .domain([min, max])
            .thresholds(x_scale.ticks((max - min) / this.each));
        const bins = this.transform(nums);
        this.y_scale = d3
            .scaleLinear()
            .domain([0, d3.max(bins, (d) => d.length) || 0])
            .range([this.HEIGHT, 0]);

        wrapper
            .append("g")
            .attr("transform", `translate(${0}, ${this.HEIGHT})`)
            .call(d3.axisBottom(x_scale));

        wrapper.append("g").call(d3.axisLeft(this.y_scale));

        this.bins = wrapper
            .selectAll("rect[class=bar]")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar");
        this.bins
            .attr("x", (d) => x_scale(d.x0 || 0))
            .attr("y", (d) => this.y_scale(d.length))
            .attr("width", (d) => x_scale(d.x1 || 0) - x_scale(d.x0 || 0))
            .attr("height", (d) => this.HEIGHT - this.y_scale(d.length))
            .style("fill", "#6ab3a3")
            .style("transition", "all 0.2s");

        wrapper
            .selectAll("rect[class=bar-bg]")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar-bg")
            .attr("x", (d) => x_scale(d.x0 || 0))
            .attr("y", (d) => this.y_scale(d.length))
            .attr("width", (d) => x_scale(d.x1 || 0) - x_scale(d.x0 || 0))
            .attr("height", (d) => this.HEIGHT - this.y_scale(d.length))
            .style("stroke", "black")
            .style("fill", "transparent");

        wrapper
            .append("text")
            .attr("x", this.WIDTH / 2)
            .attr("fill", "black")
            .style("font-size", "24px")
            .style("text-anchor", "middle")
            .text(this.type.replace(/_/g, " "));

        this.brush = svg
            .append("g")
            .attr("class", "brush")
            .call(
                d3
                    .brushX()
                    .on("brush", (evt) => {
                        const x0 = evt.selection[0];
                        const x1 = evt.selection[1];

                        const lower = x_scale.invert(x0);
                        const upper = x_scale.invert(x1);

                        state.filter[this.type] = [lower, upper];
                        state.selected = null;
                        update(state);
                    })
                    .on("end", (evt) => {
                        if (evt.selection === null) {
                            state.filter[this.type] = null;
                            update(state);
                        }
                    })
            );

        super.init(state, update);
    }

    public update(state: State): void {
        const filtering = Object.values(state.filter).some((d) => d);
        if (!filtering) {
            this.brush?.call(d3.brush().move, null);
        }

        const nums = this.players
            .filter((d) =>
                state.selected
                    ? state.selected.has(d.key)
                    : filtering
                    ? state.filtered.has(d.key)
                    : true
            )
            .map((d) => d[this.type]);

        const bins = this.transform(nums);
        this.bins
            ?.data(bins)
            .attr("height", (d) => this.HEIGHT - this.y_scale(d.length))
            .attr("y", (d) => this.y_scale(d.length));

        super.update(state);
    }
}
