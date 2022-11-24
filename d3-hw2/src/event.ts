export class Event {
    private events: Map<string, Function[]>;

    constructor() {
        this.events = new Map();
    }

    on(event: string, listener: Function) {
        if (this.events.has(event)) {
            this.events.get(event)?.push(listener);
        } else {
            this.events.set(event, [listener]);
        }
    }

    emit(event: string, ...args: unknown[]) {
        this.events.get(event)?.forEach((listener) => listener(...args));
    }
}
