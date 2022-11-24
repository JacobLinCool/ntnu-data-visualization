import * as d3 from "d3";
import { load_data } from "./load";
import { append_block } from "./utils";

main();

async function main() {
    const data = await load_data();
    console.log(data);

    const scatterplot_elm = append_block("scatterplot");
    scatterplot("#" + scatterplot_elm.id, data.nba);

    const bar_types = ["pts", "reb", "ast", "age", "gp", "draft_number"] as const;
    for (const type of bar_types) {
        const each = ["reb", "ast"].includes(type) ? 0.5 : type === "draft_number" ? 5 : 1;
        const elm = append_block(`bar_${type}`);
        bar_chart(
            "#" + elm.id,
            data.nba.map((d) => d[type]),
            type.replace(/_/g, " "),
            each
        );
    }

    const map_elm = append_block("map");
    usa_map("#" + map_elm.id, data);
}

function scatterplot(mount: string, data: Awaited<ReturnType<typeof load_data>>["nba"]) {
    const X = {
        max: Math.max(...data.map((d) => d.umapX)),
        min: Math.min(...data.map((d) => d.umapX)),
    };

    const Y = {
        max: Math.max(...data.map((d) => d.umapY)),
        min: Math.min(...data.map((d) => d.umapY)),
    };

    const SIZE = 500;
    const PADDING = 50;
    const scatterplot = d3
        .select(mount)
        .append("svg")
        .attr("width", SIZE + PADDING * 2)
        .attr("height", SIZE + PADDING * 2)
        .style("border", "1px solid gray");
    const wrapper = scatterplot.append("g").attr("transform", `translate(${PADDING}, ${PADDING})`);
    const players = wrapper.append("g");
    const x_axis = wrapper.append("g");
    const y_axis = wrapper.append("g");
    const legends = wrapper.append("g");

    const x_scaler = d3.scaleLinear().domain([X.min, X.max]).range([0, SIZE]);
    const y_scaler = d3.scaleLinear().domain([Y.max, Y.min]).range([0, SIZE]);

    const axis_x = d3.axisBottom(x_scaler).tickFormat(() => "");
    const axis_y = d3.axisLeft(y_scaler).tickFormat(() => "");

    x_axis.attr("transform", `translate(0, ${SIZE})`).call(axis_x);
    y_axis.attr("transform", `translate(0, 0)`).call(axis_y);

    const color = { astNorm: "blue", ptsNorm: "red", rebNorm: "green" };

    players
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => x_scaler(d.umapX))
        .attr("cy", (d) => y_scaler(d.umapY))
        .attr("r", (d) => (10 + d.astNorm + d.ptsNorm + d.rebNorm) / 3)
        .style("fill", (d) => {
            return {
                [d.astNorm]: color.astNorm,
                [d.ptsNorm]: color.ptsNorm,
                [d.rebNorm]: color.rebNorm,
            }[[d.astNorm, d.ptsNorm, d.rebNorm].sort((a, b) => b - a)[0]];
        })
        .style("stroke", "black");

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
}

function bar_chart(mount: string, nums: number[], type: string, each = 1) {
    const max = Math.ceil(Math.max(...nums));
    const min = Math.floor(Math.min(...nums));

    const [WIDTH, HEIGHT] = [500, 200];
    const PADDING = 30;
    const svg = d3
        .select(mount)
        .append("svg")
        .attr("width", WIDTH + PADDING * 2)
        .attr("height", HEIGHT + PADDING * 2)
        .style("border", "1px solid gray");

    const wrapper = svg.append("g").attr("transform", `translate(${PADDING}, ${PADDING})`);

    const x_scale = d3.scaleLinear().domain([min, max]).range([0, WIDTH]);
    const bins = d3
        .bin()
        .domain([min, max])
        .thresholds(x_scale.ticks((max - min) / each))(nums);
    const y_scale = d3
        .scaleLinear()
        .domain([0, d3.max(bins, (d) => d.length) || 0])
        .range([HEIGHT, 0]);

    wrapper
        .append("g")
        .attr("transform", `translate(${0}, ${HEIGHT})`)
        .call(d3.axisBottom(x_scale));

    wrapper.append("g").call(d3.axisLeft(y_scale));

    wrapper
        .selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", 1)
        .attr(
            "transform",
            (d) => "translate(" + (x_scale(d.x0 || 0) - 1) + ", " + y_scale(d.length) + ")"
        )
        .attr("width", (d) => x_scale(d.x1 || 0) - x_scale(d.x0 || 0))
        .attr("height", (d) => HEIGHT - y_scale(d.length))
        .style("fill", "#6ab3a3")
        .style("stroke", "black");

    wrapper
        .append("text")
        .attr("x", WIDTH / 2)
        .attr("fill", "black")
        .style("font-size", "24px")
        .style("text-anchor", "middle")
        .text(type);
}

function usa_map(mount: string, data: Awaited<ReturnType<typeof load_data>>) {
    const [WIDTH, HEIGHT] = [700, 400];
    const PADDING = 30;

    const svg = d3
        .select(mount)
        .append("svg")
        .attr("width", WIDTH + PADDING * 2)
        .attr("height", HEIGHT + PADDING * 2)
        .style("border", "1px solid gray");

    const wrapper = svg.append("g").attr("transform", `translate(${PADDING}, ${PADDING})`);

    const painter = d3.geoPath().projection(
        d3.geoEquirectangular().fitExtent(
            [
                [0, 0],
                [WIDTH, HEIGHT],
            ],
            data.map
        )
    );

    wrapper
        .selectAll("path")
        .data(data.map.features)
        .enter()
        .append("path")
        .attr("d", painter)
        .style("fill", "white")
        .style("stroke", "black");

    const teams = data.loc.map((d) => {
        const [x, y] = painter.centroid({ type: "Point", coordinates: [d.lon, d.lat] });
        const size = data.nba.filter((p) => p.team_abbreviation === d.team_abbreviation).length;
        return { x, y, size, team: d.team_abbreviation };
    });

    wrapper
        .selectAll("circle")
        .data(teams)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => d.size)
        .style("fill", "#ff000088")
        .style("stroke", "black");

    wrapper
        .selectAll("text")
        .data(teams)
        .enter()
        .append("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .text((d) => d.team || "");
}
