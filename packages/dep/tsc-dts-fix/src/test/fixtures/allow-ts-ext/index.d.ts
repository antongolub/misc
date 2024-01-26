declare module "b" {
    export const b = "b";
}
declare module "a" {
    export * from "b";
}
declare module "index" {
    export * from "a";
}
