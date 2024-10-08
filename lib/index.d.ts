import { z } from 'zod';

type EnvParsedFileType = Record<string, number | string | boolean | any[] | object | undefined>;
type SchemaTypes = z.ZodTypeAny;
type InferSchemaType<T, K extends keyof T> = T[K] extends z.ZodNumber ? number : T[K] extends z.ZodString ? string : T[K] extends z.ZodBoolean ? boolean : T[K] extends z.ZodEnum<infer U> ? U[number] : T[K] extends z.ZodDate ? Date : T[K] extends z.ZodOptional<z.ZodNumber> ? number | undefined : T[K] extends z.ZodOptional<z.ZodString> ? string | undefined : T[K] extends z.ZodOptional<z.ZodBoolean> ? boolean | undefined : T[K] extends z.ZodOptional<z.ZodEnum<infer U>> ? U[number] | undefined : T[K] extends z.ZodOptional<z.ZodDate> ? Date | undefined : T[K] extends z.ZodArray<infer U> ? InferSchemaType<{
    item: U;
}, 'item'>[] : T[K] extends z.ZodOptional<z.ZodArray<infer U>> ? InferSchemaType<{
    item: U;
}, 'item'>[] | undefined : T[K] extends z.ZodObject<infer U> ? {
    [P in keyof U]: InferSchemaType<U, P>;
} : T[K] extends z.ZodOptional<z.ZodObject<infer U>> ? {
    [P in keyof U]: InferSchemaType<U, P>;
} | undefined : T[K] extends z.ZodRecord<infer U> ? {
    [key: string]: InferSchemaType<U, keyof U>;
} : T[K] extends z.ZodOptional<z.ZodRecord<infer U>> ? {
    [key: string]: InferSchemaType<U, keyof U>;
} | undefined : T[K] extends z.ZodUnion<infer U> ? U[number] : T[K] extends z.ZodOptional<z.ZodUnion<infer U>> ? U[number] | undefined : T[K] extends z.ZodPromise<infer U> ? InferSchemaType<U, keyof U> : T[K] extends z.ZodOptional<z.ZodPromise<infer U>> ? InferSchemaType<U, keyof U> | undefined : T[K] extends z.ZodLazy<infer U> ? InferSchemaType<U, keyof U> : T[K] extends z.ZodOptional<z.ZodLazy<infer U>> ? InferSchemaType<U, keyof U> | undefined : any;
type envFileNames = '.env' | '.env.local' | '.env.development' | '.env.production' | '.env.test' | '.env.staging' | '.local.env' | '.development.env' | '.production.env' | '.test.env' | '.staging.env' | '.env.local.local' | '.env.local.development' | '.env.local.production' | '.env.local.test' | '.env.local.staging' | '.env.development.local' | '.env.development.development' | '.env.development.production' | '.env.development.test' | '.env.development.staging' | '.env.production.local' | '.env.production.development' | '.env.production.production' | '.env.production.test' | '.env.production.staging' | '.env.test.local' | '.env.test.development' | '.env.test.production' | '.env.test.test' | '.env.test.staging' | '.env.staging.local' | '.env.staging.development' | '.env.staging.production' | '.env.staging.test';

declare class EnvironmentManager<T extends Record<string, SchemaTypes>> {
    schema: z.ZodObject<T>;
    private rootPath;
    private envs;
    private logs;
    private throwErrorOnValidationFail;
    private envFileHierarchy;
    private constructor();
    /**
     *
     * @returns - Returns all the environment variables
     */
    getAll(): EnvParsedFileType;
    /**
     * @description - Used for schema-less environment variable retrieval
     */
    static getInstance<T extends Record<string, SchemaTypes>>(options?: {
        logs?: boolean;
        rootPath?: string;
        envFileHierarchy?: envFileNames[];
    }): EnvironmentManager<T>;
    /**
     * @description - This function is used to create the schema for the environment variables
     * @param cb - A callback function that returns the schema for the environment variables
     * @param options - An object that contains the options for the environment manager
     */
    static createEnvSchema<T extends Record<string, SchemaTypes>>(schemaBuilder: (schema: typeof z) => z.ZodObject<T>, options?: {
        logs?: boolean;
        rootPath?: string;
        throwErrorOnValidationFail?: boolean;
        envFileHierarchy?: envFileNames[];
    }): Promise<EnvironmentManager<T>>;
    get(key: string, defaultValue?: any): any;
    get<K extends keyof T>(key: K, defaultValue?: any): InferSchemaType<T, K>;
    protected collectEnvs(): EnvParsedFileType;
    protected parseEnvFile(envPath: string): EnvParsedFileType;
}

declare const getInstance: typeof EnvironmentManager.getInstance;
declare const createEnvSchema: typeof EnvironmentManager.createEnvSchema;

export { createEnvSchema, getInstance };
