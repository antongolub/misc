/// <reference types="node" />
declare module "package-name/depseek" {
    export const foo = "bar";
}
declare module "package-name/a" {
    export * from "package-name/depseek";
}
declare module "package-name/b" {
    export * from 'depseek';
}
declare module "package-name/c" {
    export * from "package-name/depseek";
    export * from "depseek";
}
declare module "package-name/d" {
    export const seek: (opts: any) => void;
}
declare module "package-name/e" {
    export const seek2: (stream: string | import("stream").Readable, opts?: Partial<import("depseek").TOptsNormalized>) => Promise<import("depseek").TCodeRef[]>;
}
declare module "package-name/index" {
    import type { Readable } from "node:stream";
    export * from "package-name/a";
    export * from "package-name/b";
    export * from "package-name/c";
    export * from "package-name/d";
    export * from "package-name/e";
    export type ReadablePlus = Readable & {
        plus: string;
    };
}
declare module "package-name" {
    export * from "package-name/index"
}