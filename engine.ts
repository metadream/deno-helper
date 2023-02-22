import { Tmplet } from "./deps.ts";

// Built-in template engine with tmplet
export class Engine {

    /**
     * Init engine options
     * @param options
     */
    // deno-lint-ignore no-explicit-any
    init(options: any) {
        Tmplet.init(options);
    }

    /**
     * Render template file
     * @param file
     * @param data
     * @returns rendered html
     */
    // deno-lint-ignore no-explicit-any
    view(file: string, data: any = {}) {
        return Tmplet.view(file, data);
    }

    /**
     * Render template text
     * @param tmpl
     * @param data
     * @returns rendered html
     */
    // deno-lint-ignore no-explicit-any
    render(tmpl: string, data: any = {}) {
        return Tmplet.render(tmpl, data);
    }

}