sql-schema-generator
==============

Declarative relational database schema generation. Ensure best practices are followed and abstract away boiler plate sql.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sql-schema-generator.svg)](https://npmjs.org/package/sql-schema-generator)
[![Codecov](https://codecov.io/gh/uladkasach/sql-schema-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/uladkasach/sql-schema-generator)
[![Downloads/week](https://img.shields.io/npm/dw/sql-schema-generator.svg)](https://npmjs.org/package/sql-schema-generator)
[![License](https://img.shields.io/npm/l/sql-schema-generator.svg)](https://github.com/uladkasach/sql-schema-generator/blob/master/package.json)

# Table of Contents
<!-- toc -->
* [Table of Contents](#table-of-contents)
* [Overview](#overview)
* [Usage](#usage)
* [Commands](#commands)
* [Contribution](#contribution)
<!-- tocstop -->

# Overview

`sql-schema-generator` does two things for us:
- **generates sql** for "persisted entities" (both static and updatable) in relational databases, based on a declarative definition of entities
  - i.e., it generates the following resources:
    - to interact with data
      - entity static table
      - entity version table (if updatable properties exist, for an insert-only / event-driven design, per temporal database design)
      - entity mapping tables (if array properties exist, to define the many-to-many relationship)
      - upsert function (for idempotent inserts)
      - a `_current` view, to abstract away the versioning pattern and mapping tables
    - to improve performance
      - entity current version pointer table (if updatable properties exist, to make looking up the current version fast at scale)
      - backfill_current_version_pointers function (for if changes had to be made manually and to ensure everything is in sync)
- **encodes best practices**
  - optimal data types
  - case sensitivity by default
  - insert only (using temporal database design to maintain normalized tables and uniqueness constraints)
  - abstractions to simplify dealing with temporal database design schema (upsert function and _current view)
  - performance improvements to temporal database design pattern by utilizing the current_version_pointer tables
  - naming conventions (e.g., all columns that reference another entity must end with `_id` or `_id`)

Note: the user has complete flexibility to update the generated sql to suite any edge case - simply modify the generated, boiler-plate, best-practice sql generated by this util.

# Motivation and Inspiration

### Motivation

The motivation of `sql-schema-generator` is to:
- abstract away the boilerplate and complexity of persisting data in a relational database with "best practices"
- reduce work required to setup and maintain resources required for persisting data in relational database
- define one source of truth for best practices in relational database resources
- avoid "lock in" to any specific library and the risk that you'll come across an edge case scenario that the library does not support

Consequently, by utilizing the schema generator:
- you are able to think less about the schema you need to write to persist an entity (i.e., infrastructure logic) and more about the entity itself (i.e., domain logic).
- you can rapidly and confidently deploy relational database resources, knowing that battle tested, production ready, and thoroughly tested best practices are being used
- you can quickly upgrade existing schema whenever best practices change, by simply re-running schema generation and comparing the git diff if custom changes were made
- you can comfortably modify any generated schema to support edge cases or differences in opinion not already supported by the library, as you fully manage the sql that was generated

### Inspiration
- [Domain Driven Design](https://dddcommunity.org/learning-ddd/what_is_ddd/): domain driven design provides tools to define the Domain Model in a ubiquitous language (Entities, Value Objects, etc), which increase increases the maintainability and utility of the infrastructure you spend time building.
- [Temporal Database Design](https://dba.stackexchange.com/a/114738/75296): temporal database design provides a way to optimally implement the "insert only" data lifecycle pattern, retaining the changes an entity goes through over time while also maintaining foreign keys, uniqueness constraints, and normalization.

# Usage

1. Save the package as a dev dependency
  ```sh
  npm install --save-dev sql-schema-generator
  ```

2. Declare your entities, somewhere in your VCS repo
  ```ts
  // for example: in <root>/schema/entities.ts

  import { Entity, prop, ValueObject } from '../module';

  const photo = new ValueObject({
    name: 'photo',
    properties: {
      url: prop.VARCHAR(),
    },
  });
  const user = new Entity({
    name: 'user',
    properties: {
      phone_number: prop.CHAR(10), // only us numbers allowed
      first_name: prop.VARCHAR(),
      last_name: prop.VARCHAR(),
      avatar_id: { ...prop.REFERENCES(photo), updatable: true, nullable: true },
    },
    unique: ['phone_number'], // users are identified by their phone number
  });
  const home = new Entity({
    name: 'home',
    properties: {
      name: prop.VARCHAR(),
      owner_id: prop.REFERENCES(user),
      built: prop.TIMESTAMPTZ(),
      bedrooms: prop.INT(),
      bathrooms: prop.INT(),
      photo_ids: { ...prop.ARRAY_OF(prop.REFERENCES(photo)), updatable: true }, // array of photos
    },
    unique: ['name', 'owner_id'],
  });
  const listing = new Entity({
    name: 'listing',
    properties: {
      agent_id: prop.REFERENCES(user),
      home_id: prop.REFERENCES(home),
      description: { ...prop.TEXT(), updatable: true },
      price: { ...prop.NUMERIC(10, 2), updatable: true },
    },
    unique: [], // because the same agent can list the same home more than once, there is nothing unique about a listing
  })

  export const entities = [photo, user, home, listing];
  ```

3. Run the generate command
  ```sh
  npx sql-schema-generator generate -d schema/entities.ts -t schema/generated
  ```

4. Check the generated into your VCS (version control software, e.g. git)
     - Steps 2 and 3 above will have produced tables, functions, and views for each entity, as required. For best practice, we encourage you to check these sql resources into your VCS. This will make it easy to detect changes in the source sql, if ever modified, and for peer reviews.

5. Use a schema management tool like schema-control or liquibase to apply your schema
     - https://github.com/uladkasach/schema-control
     - https://www.liquibase.org/index.html

6. ???

7. Profit

# Supported Databases

## PostgreSQL
PostgreSQL is the primary target of `sql-schema-generator` since `v0.18.0`. PostgreSQL is a great database for the large majority of applications, for many reasons.

## MySQL
Support for MySQL has ended with `v0.18.0`. Versions `v0.17.1` and earlier, which support MySQL, can still be installed. No new features or support will be targeting MySQL.

# Commands
<!-- commands -->
* [`sql-schema-generator generate`](#sql-schema-generator-generate)
* [`sql-schema-generator help [COMMAND]`](#sql-schema-generator-help-command)

## `sql-schema-generator generate`

generate sql schema for immutable and mutable entities: tables, upsert method, and views

```
USAGE
  $ sql-schema-generator generate

OPTIONS
  -d, --declarations=declarations  (required) [default: declarations.ts] path to config file, containing entity
                                   definitions

  -h, --help                       show CLI help

  -t, --target=target              (required) [default: generated] target directory to record generated schema into
```

## `sql-schema-generator help [COMMAND]`

display help for sql-schema-generator

```
USAGE
  $ sql-schema-generator help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_
<!-- commandsstop -->


# Contribution

Team work makes the dream work! Please create a ticket for any features you think are missing and, if willing and able, draft a PR for the feature :)

### Testing
1. start the integration test db
  - *note: you will need docker and docker-compose installed for this to work*
  - `npm run integration-test-provision-db`
2. run the tests
  - `npm run test`

### Test Coverage
Test coverage is essential for maintainability, readability, and ensuring everything works! Anything not covered in tests is not guarenteed to work.

Test coverage:
- proves things work
- immensely simplifies refactoring (i.e., maintainability)
- encourages smaller, well scoped, more reusable, and simpler to understand modules (unit tests especially)
- encourages better coding patterns
- is living documentation for code, guaranteed to be up to date

#### Unit Tests
Unit tests should mock out all dependencies, so that we are only testing the logic in the immediate test. If we are not mocking out any of the imported functions, we are 1. testing that imported function (which should have its own unit tests, so this is redundant) and 2. burdening ourselfs with the considerations of that imported function - which slows down our testing as we now have to meet those constraints as well.

Note: Unit test coverage ensures that each function does exactly what you expect it to do (i.e., guarentees the contract). Compile time type checking (i.e., typescript) checks that we are using our dependencies correctly. When combined together, we guarentee that the contract we addition + compile time type checking guarentee that not only are we using our dependencies correctly but that our dependencies will do what we expect. This is a thorough combination.

`jest`

#### Integration Tests
Integration tests should mock _nothing_ - they should test the full lifecycle of the request and check that we get the expected response for an expected input. These are great to use at higher levels of abstraction - as well at the interface between an api (e.g., db connection or client).

`jest -c jest.integration.config.js`

### Internal Patterns

Below are a few of the patterns that this project uses and the rational behind them.
- typed objects: every domain object that is worked with in this project is represented by a typed object in order to formally define a ubiquitous language and enforce its usage throughout the code
- contract - logic - data: this module formally distinguishes the contract layer, the logic layer, and the data layer:
  - The contract layer defines what we expose to users and under what requirements. This is where any input validation or output normalization occurs. This is where we think about minimizing the amount of things we expose - as each contract is something more to maintain.
  - The logic layer defines the domain logic / business logic that this module abstracts. This is where the heart of the module is and is where the magic happens. This layer is used by the contract layer to fulfill its promises and utilizes the data layer to persist data.
  - The data layer is a layer of abstraction that enables easy interaction with data sources and data stores (e.g., clients and databases). This module only uses the database.
