# Environment-manager

- Environment manager for node.js
- Built on top of Zod used for schema validation

## How To Use

### Schema Based Env Manager
```typescript
import { createEnvSchema } from "envitron";

const env = await createEnvSchema(
  (z) => {
    return z.object({
      NODE_ENV: z.enum(["development", "production"]),
      DATABASE_URL: z.string().default('postgres://localhost:5432'),
      API_KEY: z.string(),
      DEBUG: z.boolean(),
      EMPTY_VALUE: z.string(),
      QUOTED_EMPTY_VALUE: z.string(),
      SINGLE_QUOTED_EMPTY_VALUE: z.string(),
      SPACED_KEY: z.string(),
      SPACED_KEY_WITH_QUOTES: z.string(),
      SPECIAL_CHARS_IN_VALUE: z.string(),
      TRAILING_SPACES: z.string(),
      LIST_OF_VALUES_WITH_QUOTES: z.array(z.string()),
      LIST_OF_VALUES_WITH_SINGLE_QUOTES: z.array(z.string()),
      LIST_OF_VALUES_WITHOUT_QUOTES: z.array(z.string()),
      OBJECT: z.object({ key: z.string() }),
    });
  },
  {
    logs: false,
    throwErrorOnValidationFail: false,
    rootPath: process.cwd(),
    envFileHierarchy: ['.env'],
  }
);

// Retrieve all the environment variables
const allEnvs = env.getAll();

// Retrieve a specific schema environment variable with a default value, the type will be inferred from the schema
const schemaBasedNodeEnv = env.get('NODE_ENV', "development");

// You can define a default value both in the get() method and in the zod schema (defaultValue in the get() method has the priority)
const databaseUrlWithSchemaDefault = env.get('DATABASE_URL'); // postgres://localhost:5432
const databaseUrlWithLocalDefault = env.get('DATABASE_URL', "postgres://12.12.12.12:5432"); // postgres://12.12.12.12:5432

// Retrieve searching on all the environment variables regardless of the schema
const outsideSchemaEnv = env.get('NON_SCHEMA_ENV');
```

### Schema Less Environment Manager
```typescript
import { getInstance } from "envitron";

const schemaLessEnvManager = getInstance({
  rootPath: __dirname,
  envFileHierarchy: ['.env'],
});

// Retrieve all the environment variables
const allEnvsSchemaLess = schemaLessEnvManager.getAll();

// Retrieve an env from the environment manager
const nodeEnv = schemaLessEnvManager.get('NODE_ENV', "development");
```

## Env Example

- To better understand the functionality of the env manager is an example of all handled use cases and resulting values
- !!! Envs must be defined in a single line regardless of their type !!!

```dotenv
// NUMBERS
PORT=80

// STRINGS 
NODE_ENV=development
DATABASE_URL = " Example "
API_KEY=' 12345 '
DEBUG=true
QUOTED_EMPTY_VALUE=""
SINGLE_QUOTED_EMPTY_VALUE=''
SPACED_KEY = spaced_value
SPACED_KEY_WITH_QUOTES = " spaced_value "
SPECIAL_CHARS_IN_VALUE="!@#$%^&*()_+"
TRAILING_SPACES=trailing_spaces

// EMPTY
EMPTY_VALUE=

// LISTS (must be defined in square brackets with values separated by commas)
LIST_OF_VALUES_WITH_QUOTES=[" example", "example "]
LIST_OF_VALUES_WITH_SINGLE_QUOTES=[' example', "example"]
LIST_OF_VALUES_WITHOUT_QUOTES=[example, example]

// OBJECTS (NOT ADVISED, must be able to pass a JSON.parse call)
OBJECT={"key":"value"}
```

- Will be parsed into:
```any
{
  NODE_ENV: 'development',
  DATABASE_URL: ' DAJEEEEE ',
  API_KEY: ' 12345 ',
  DEBUG: 'true',
  SPACED_KEY: 'spaced_value',
  SPACED_KEY_WITH_QUOTES: ' spaced_value ',
  SPECIAL_CHARS_IN_VALUE: '!@#$%^&*()_+',
  TRAILING_SPACES: 'trailing_spaces',
  LIST_OF_VALUES_WITH_QUOTES: [ '0', '1' ],
  LIST_OF_VALUES_WITH_SINGLE_QUOTES: [ ' example', 'example' ],
  LIST_OF_VALUES_WITHOUT_QUOTES: [ 'example', 'example' ],
  OBJECT: { key: 'value' }
}
```
