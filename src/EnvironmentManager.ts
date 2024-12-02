import fs from 'fs';
import path from 'path';
import logger, { log } from './Logger';
import {
  InferSchemaType,
  envFileNames,
  EnvParsedFileType,
  SchemaTypes,
  InferSchemaTypeForGetAll,
} from './EnvironmentManagerConstants';
import { z } from 'zod';

export default class EnvironmentManager<T extends Record<string, SchemaTypes>> {
  public schema: z.ZodObject<T>;
  private rootPath: string;
  private envs: EnvParsedFileType;
  private logs: boolean;
  private throwErrorOnValidationFail: boolean;
  private envFileHierarchy: envFileNames[];

  private constructor(
    schemaBuilder: (schema: typeof z) => z.ZodObject<T>,
    options?: {
      logs?: boolean;
      rootPath?: string;
      throwErrorOnValidationFail?: boolean;
      envFileHierarchy?: envFileNames[];
    }
  ) {
    this.rootPath = path.resolve(process.cwd(), options?.rootPath || '');
    this.logs = options?.logs ?? true;
    this.throwErrorOnValidationFail = options?.throwErrorOnValidationFail ?? true;
    this.envFileHierarchy = options?.envFileHierarchy || ['.env'];
    this.envs = this.collectEnvs();
    this.schema = schemaBuilder(z);
  }

  /**
   * @description - Used for schema-less environment variable retrieval
   */
  public static getInstance<T extends Record<string, SchemaTypes>>(options?: {
    logs?: boolean;
    rootPath?: string;
    envFileHierarchy?: envFileNames[];
  }): EnvironmentManager<T> {
    const envFileHierarchy = options?.envFileHierarchy || ['.env'];
    const logs = options?.logs ?? true;
    const throwErrorOnValidationFail = false;
    const rootPath = path.resolve(process.cwd(), options?.rootPath || '');
    const envManagerInstance = new EnvironmentManager(() => z.object({}) as any, {
      logs,
      rootPath,
      throwErrorOnValidationFail,
      envFileHierarchy,
    });
    envManagerInstance.envs = envManagerInstance.collectEnvs();
    return envManagerInstance as EnvironmentManager<T>;
  }

  /**
   * @description - This function is used to create the schema for the environment variables
   * @param cb - A callback function that returns the schema for the environment variables
   * @param options - An object that contains the options for the environment manager
   */
  public static createEnvSchema<T extends Record<string, SchemaTypes>>(
    schemaBuilder: (schema: typeof z) => z.ZodObject<T>,
    options?: {
      logs?: boolean;
      rootPath?: string;
      throwErrorOnValidationFail?: boolean;
      envFileHierarchy?: envFileNames[];
    }
  ): EnvironmentManager<T> {
    const envFileHierarchy = options?.envFileHierarchy || ['.env'];
    const logs = options?.logs ?? true;
    const throwErrorOnValidationFail = options?.throwErrorOnValidationFail ?? true;
    const rootPath = path.resolve(process.cwd(), options?.rootPath || '');
    const envManagerInstance = new EnvironmentManager(schemaBuilder, {
      logs,
      rootPath,
      throwErrorOnValidationFail,
      envFileHierarchy,
    });
    envManagerInstance.envs = envManagerInstance.collectEnvs();
    try {
      envManagerInstance.schema.parse(envManagerInstance.envs);
    } catch (error: any) {
      if (envManagerInstance.throwErrorOnValidationFail) {
        throw error;
      }

      logger.error(error);
    }

    return envManagerInstance;
  }

  /**
   * @description - This function is used to get a value from the environment variables from the schema
   * @description - In order to retrieve an outside schema value, use the getRaw function
   * @param key - The key to retrieve from the environment variables
   * @param defaultValue - The default value to return if the key is not found, has priority over the schema default value
   * @returns
   */
  public get<K extends keyof T>(
    key: K,
    defaultValue?: any,
    schema?: z.ZodObject<T>
  ): InferSchemaType<T, K>;
  public get<K extends keyof T>(
    key: string,
    defaultValue?: any,
    schema?: z.ZodObject<T>
  ): InferSchemaType<T, K>;
  public get<K extends keyof T>(
    key: K,
    defaultValue?: any,
    schema: z.ZodObject<T> = this.schema
  ): InferSchemaType<T, K> {
    if (!this.envs) {
      this.envs = this.collectEnvs();
    }

    const value = this.envs[key as string];
    if (value === undefined) {
      const schemaDefaultValue = schema.shape[key as string]?._def.defaultValue?.() ?? undefined;
      return defaultValue ?? schemaDefaultValue;
    }

    const retrievedEnv = schema.shape[key as string];
    if (!retrievedEnv) {
      return value as any;
    }

    return retrievedEnv.parse(value);
  }

  /**
   * @returns - Returns all the environment variables part of the schema
   */
  public getAll(): InferSchemaTypeForGetAll<T> & { [key: string]: any } {
    if (!this.envs) {
      this.envs = this.collectEnvs();
    }

    return this.envs as InferSchemaTypeForGetAll<T> & { [key: string]: any };
  }

  protected collectEnvs(): EnvParsedFileType {
    const envFileHierarchy = this.envFileHierarchy;
    if (typeof envFileHierarchy === 'string') {
      const envPath = `${this.rootPath}/${envFileHierarchy}`;
      if (!fs.existsSync(envPath) && !this.throwErrorOnValidationFail) {
        log(`Environment file not found: ${envPath}`, this.logs);
        return {};
      }

      if (!fs.existsSync(envPath)) {
        throw new Error(`Environment file not found: ${envPath}`);
      }

      return this.parseEnvFile(envPath);
    }

    for (const envFile of envFileHierarchy) {
      const envPath = `${this.rootPath}/${envFile}`;
      if (!fs.existsSync(envPath)) {
        log(`Environment file not found: ${envPath}`, this.logs);
        log(`Trying next environment file...`, this.logs);
        continue;
      }

      return this.parseEnvFile(envPath);
    }

    if (this.throwErrorOnValidationFail) {
      throw new Error('Environment file not found');
    }

    log('No environment file in the hierarchy list found', this.logs);
    return {};
  }

  protected parseEnvFile(envPath: string): EnvParsedFileType {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envs = envFile.split('\n');
    const envsObject: EnvParsedFileType = {};
    const regex = /^(\S+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\[.*\]|\{.*\}|\S+))/;

    for (const env of envs) {
      const match = env.match(regex);
      if (!match) {
        continue;
      }

      const key = match[1];
      let value: string | boolean | any[] = match[2] || match[3] || match[4];
      if (value && value.trim().startsWith('#')) {
        continue;
      }

      // Handle "" or ''
      if (value === undefined) {
        value = '';
      }

      // Handle array values
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim().replace(/^["']|["']$/g, ''));
      }

      // Handle object values
      if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error(`Failed to parse JSON in the environment file for key ${key}: ${value}`);
        }
      }

      // handle boolean values
      if (value === 'true' || value === 'false') {
        value = Boolean(value);
      }

      envsObject[key] = value;
    }

    return envsObject;
  }
}
