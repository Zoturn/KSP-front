# Spec Delta

## Purpose

The frame every visitor sees before any feature exists: a page that renders at a known URL, a
readable answer when the URL is unknown or the page fails, and honest treatment of data that is
still loading, absent, or broken.

## ADDED Requirements

### Requirement: The application renders at its root URL

The system SHALL serve a working page at the root URL, within a persistent frame that is present
on every route, so that navigation replaces page content without rebuilding the surrounding
chrome.

#### Scenario: A visitor opens the site

- **WHEN** a visitor loads the root URL
- **THEN** the system renders the page content within the shared frame
- **AND** the frame identifies the site and offers navigation to the routes that exist

#### Scenario: Navigating between routes

- **WHEN** a visitor follows in-app navigation to another route
- **THEN** the page content changes
- **AND** the surrounding frame is not re-rendered from scratch, and scroll or focus is not lost
  to a full page reload

### Requirement: An unknown URL is answered, not left blank

The system SHALL respond to a URL that matches no route with a page that says so and offers a
route back, rather than an empty view or a silent failure.

#### Scenario: A visitor opens a URL that does not exist

- **WHEN** a visitor loads a URL matching no defined route
- **THEN** the system renders a not-found page explaining that the page does not exist
- **AND** offers navigation back to a page that does

### Requirement: A failed render is contained

The system SHALL contain an unexpected rendering failure so the visitor sees an explanation and
a way to recover, instead of a blank screen. A failure in one part of the page MUST NOT be the
reason the entire application disappears.

#### Scenario: A component throws while rendering

- **WHEN** a component throws an unexpected error during render
- **THEN** the system shows an error message in place of the failed content
- **AND** offers the visitor a way to retry or return to a working page
- **AND** the visitor is never left looking at an empty page with no explanation

### Requirement: Loading, empty, error and success are distinct, visible states

The system SHALL treat "data has not arrived yet", "data arrived and there is none", "data
could not be fetched" and "data arrived and is being shown" as four different things the
visitor can tell apart. None of the first three MAY be rendered as an indefinite blank area,
and the fourth MUST NOT be reached while any of the others still applies.

This is a requirement rather than a guideline because the failure is invisible in development,
where data is fast and present: the empty and error paths are the ones that reach users
untested.

#### Scenario: Data is being fetched

- **WHEN** a view depends on data that has not yet arrived
- **THEN** the system indicates that it is loading

#### Scenario: Data arrives and is empty

- **WHEN** a view's data loads successfully and contains no items
- **THEN** the system states that there is nothing to show
- **AND** does not present it as an error

#### Scenario: Data cannot be fetched

- **WHEN** a view's data fails to load
- **THEN** the system says that it failed
- **AND** offers a way to retry
- **AND** does not present the failure as an empty result

#### Scenario: Data arrives with content

- **WHEN** a view's data loads successfully and contains something to show
- **THEN** the system renders that content
- **AND** no loading, empty or error indication remains visible

### Requirement: Visual decisions come from a single token set

The system SHALL define its colours, spacing, typography and radii once, as named design
tokens, and build every surface from them. A visual value MUST NOT be introduced ad hoc at the
point of use.

The observable consequence is the point: changing a token changes every surface that uses it,
so the token set is the thing that can be reviewed and kept coherent.

#### Scenario: A token value changes

- **WHEN** the value behind a design token is changed in one place
- **THEN** every component built from that token reflects the change
- **AND** no component continues to display the previous value

### Requirement: Interactive elements are reachable without a mouse

The system SHALL make every interactive element operable by keyboard and identifiable by
assistive technology, as a property of the components themselves rather than a later audit.

#### Scenario: Keyboard navigation through the shell

- **WHEN** a visitor moves through the page using only the keyboard
- **THEN** focus reaches every interactive element in a sensible order
- **AND** the focused element is visibly distinguishable

#### Scenario: A control with no visible text

- **WHEN** a control conveys its purpose only visually, such as by an icon
- **THEN** it still exposes an accessible name describing what it does
