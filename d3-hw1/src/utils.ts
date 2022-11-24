export function append_block(id: string) {
    const elm = document.createElement("div");
    elm.id = id;
    document.body.appendChild(elm);

    return elm;
}
