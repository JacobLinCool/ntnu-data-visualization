export function append_block(id: string) {
    const elm = document.createElement("div");
    elm.id = id;
    elm.style.display = "inline-block";
    elm.style.position = "absolute";
    elm.style.top = "0";
    elm.style.left = "0";
    document.querySelector("#board")?.appendChild(elm);

    return elm;
}

export function copy(obj: unknown) {
    return JSON.parse(JSON.stringify(obj));
}

export function random_key() {
    return Math.random().toString(36).substring(2);
}
