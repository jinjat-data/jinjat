export type State<T> = EventTarget & T;

const createEvent = <T>(obj: T): State<T> =>
    // check for window so it works in SSR
    typeof window === "undefined"
        ? Object.assign({} as EventTarget, obj)
        : Object.assign(new EventTarget(), obj);

export const createState = <T extends object>(obj: T): State<T> =>
    new Proxy(createEvent(obj), {
        set: (obj, key, value) => {
            Reflect.set(obj, key, value);
            obj.dispatchEvent(new CustomEvent("change", { detail: { ...obj } }));
            return true;
        },
        get: (obj, key) => {
            const value = Reflect.get(obj, key);
            if (typeof value === "function") {
                return value.bind(obj);
            }
            return value;
        },
        deleteProperty: (obj, key) => {
            Reflect.deleteProperty(obj, key);
            obj.dispatchEvent(new CustomEvent("change", { detail: { ...obj } }));
            return true;
        },
    });