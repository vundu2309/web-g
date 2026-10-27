interface ImportMeta {
  readonly env: {readonly DEV: boolean; readonly PROD: boolean};
}

declare module '*.css?raw' {
  const source: string;
  export default source;
}
