/// <reference types="node" />
declare module "depseek" {
    export const foo = "bar";
}
declare module "a" {
    export * from "depseek";
}
declare module "b" {
    export * from 'depseek';
}
declare module "c" {
    export * from "depseek";
    export * from "depseek";
}
declare module "d" {
    export const seek: (opts: any) => void;
}
declare module "e" {
    export const seek2: (stream: string | import("stream").Readable, opts?: Partial<import("depseek").TOptsNormalized>) => Promise<import("depseek").TCodeRef[]>;
}
declare module "index" {
    import type { Readable } from "node:stream";
    export * from "a";
    export * from "b";
    export * from "c";
    export * from "d";
    export * from "e";
    export type ReadablePlus = Readable & {
        plus: string;
    };
}
