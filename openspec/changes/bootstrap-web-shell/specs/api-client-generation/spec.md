# Spec Delta

## Purpose

Keeps this repository's view of the API honest: the typed client is derived from the backend's
published schema rather than described by hand, so a schema change becomes a build failure here
instead of a bug discovered by a user.

## ADDED Requirements

### Requirement: The typed client is generated from the published schema

The system SHALL derive its API types and operations from the backend's committed schema
artifact. API types MUST NOT be hand-written, and generated output MUST NOT be hand-edited.

#### Scenario: Generating the client

- **WHEN** the generation step is run against the backend's committed schema
- **THEN** typed operations and types are produced for this repository to consume
- **AND** they are placed where it is unambiguous that they are generated rather than authored

#### Scenario: A developer edits generated output

- **WHEN** generated output is modified by hand
- **THEN** the next generation run discards the modification
- **AND** nothing in the repository depends on the modification having survived

### Requirement: Generation does not require a running server

The system SHALL generate from the committed schema file, not by introspecting a live endpoint,
so that generation works where no server and no database exist — a clean checkout, or CI.

Introspection is disabled in the backend's production configuration, so a live-endpoint approach
would appear to work in development and fail exactly where it is needed.

#### Scenario: Generating with nothing running

- **WHEN** the generation step is run with no backend server and no database available
- **THEN** it completes successfully using the committed schema

### Requirement: A schema the client cannot be generated from fails loudly

The system SHALL fail with a clear, actionable message when the schema artifact is missing,
unreadable, or not where it is expected — naming what it looked for and what to do. It MUST NOT
fall back to a stale copy, an empty schema, or a confusing downstream type error.

The backend lives in a sibling checkout, so "the schema is not there" is an ordinary situation
on a fresh clone, not an exotic one.

#### Scenario: The schema artifact is absent

- **WHEN** the generation step runs and the backend's schema artifact cannot be found
- **THEN** generation fails with a message naming the path it expected and how to obtain it
- **AND** no partial or stale client is produced

#### Scenario: The schema disappears after a client was already generated

- **WHEN** generation runs without a schema while output from an earlier run is present
- **THEN** that earlier output is not left behind for a subsequent build or test run to consume
- **AND** the failure is reported in terms of the missing schema, not of missing generated code

### Requirement: A reported error is never consumed as success, and arriving data is never discarded

The system SHALL decide success or failure from the reported errors rather than from the
transport status, because the API reports application failures with a success status. A result
carrying errors and no data MUST be surfaced as a failure, together with the machine-readable
code that tells the caller what kind of failure it was. A result carrying both data and errors
MUST make both available: the data that resolved is not thrown away because something beside
it did not.

Both halves are failure modes that have shipped in real applications: the first renders an
error as an empty success, and the second blanks a mostly-working page over one failed field.

#### Scenario: The result reports errors and carries no data

- **WHEN** a request completes and reports errors with no accompanying data
- **THEN** the caller observes a failure
- **AND** the failure carries the machine-readable code and any field-level validation details

#### Scenario: The result carries both data and errors

- **WHEN** a request completes with some data and a reported error beside it
- **THEN** the caller observes the data that resolved
- **AND** the reported errors remain available to be surfaced

#### Scenario: The request itself fails

- **WHEN** a request fails in transport, is rejected as a malformed document, or returns a body
  that is not a valid result
- **THEN** the caller observes a failure
- **AND** never an empty success

### Requirement: Drift between the client and the schema breaks the build

The system SHALL surface a backend schema change that invalidates this repository's queries as a
type or build failure, rather than allowing a request to be sent that the server will reject at
runtime.

#### Scenario: The backend removes or renames a field this repository selects

- **WHEN** the schema is regenerated after a backend change that removes or renames a field used
  by an existing operation
- **THEN** the affected code fails to type-check
- **AND** the failure identifies the operation and field involved

### Requirement: Queries select only the fields that are used

The system SHALL request only the fields a consumer actually renders. Over-selection is not a
cosmetic issue: each unused relation field on the backend costs a batched database round trip
for data that is then discarded.

#### Scenario: An operation requests a field nothing renders

- **WHEN** an operation selects a field that no consumer of its result reads
- **THEN** that field is removed from the operation
