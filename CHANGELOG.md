# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.4-continued] - 2026-03-05

### Added
- New `unit_font_size` option to independently control the unit of measurement font size
  - Accepts any CSS length value (e.g., `20px`, `1em`, `1.2rem`)
  - Overrides the default browser `<small>` tag sizing
  - Configurable in the visual editor under Sizing
  - Thanks to [@EdDickens](https://github.com/EdDickens) for raising this in issue #8

## [1.2.3-continued] - 2026-03-04

### Fixed
- Time and other mixed-format sensor values (e.g. "2:13 PM") now display correctly.
  Previously, `parseFloat()` was used to detect numeric values, which partially parsed
  strings like "2:13 PM" and returned only "2". Switched to `Number()`, which correctly
  returns NaN for non-numeric strings so the original value is displayed unchanged.

## [1.2.2-continued] - 2026-02-26

### Added
- New `unit_position` option to place the unit before the value instead of after
  - `unit_position: left` displays as `£5.06` instead of `5.06£`
  - `unit_position: right` (default) preserves existing behaviour
  - Useful for currency symbols and any prefix-style units
  - Configurable in the visual editor under Display Options

## [1.2.1-continued] - 2026-02-26

### Fixed
- Gradient background now works correctly with themes that use card-mod to override
  ha-card's background (e.g. Frosted Glass theme). The gradient was previously set
  directly on ha-card, which card-mod's async CSS injection would silently replace
  with `transparent`. The gradient is now rendered on an inner div that is unaffected
  by theme background overrides.

## [1.2.0-continued] - 2026-01-19

### Added
- Visual configuration editor for Home Assistant UI
  - Entity picker with autocomplete
  - All card options configurable without YAML
  - Collapsible sections for organized settings:
    - Basic Settings (entity, title)
    - Display Options (attribute, hide unit, decimal places, custom unit)
    - Colors (text color, fill color, background color, opacity)
    - Sizing (scale, value/title font sizes, card padding)
    - Progress Bar (min, max, fill direction)
    - None State Handling (display text, CSS classes)
    - Tap Action (all action types with conditional fields)
    - Severity Levels (add/remove/edit thresholds in UI)
  - Card preview updates in real-time as settings change

## [1.1.0-continued] - 2026-01-14

### Added
- New `background_color` option for unfilled bar portion
  - Can be set globally or per-severity condition
  - Defaults to card background color for backwards compatibility

### Changed
- Standardized color option names for clarity (backwards compatible)
  - `fill_color` replaces `bnStyle` (old name still works)
  - `text_color` replaces `color` (old name still works)
  - `background_color` for unfilled bar (new option)
- Internal CSS variables renamed for consistency:
  - `--bignumber-color` renamed to `--bignumber-text-color`

## [1.0.0-continued] - 2025-12-15

### Added
- Locale-aware number formatting with automatic thousands separators (PR #46)
  - Uses browser locale for formatting (e.g., 19,578 in US, 19.578 in German)
  - Respects existing `round` configuration for decimal precision
  - Fully automatic, no configuration needed
- Customizable font sizes and padding (PR #47)
  - New `title_font_size` option for independent title sizing
  - New `value_font_size` option for independent value sizing
  - New `card_padding` option for height control separate from fonts
  - Allows small cards with large fonts or vice versa
- Configurable tap actions (PR #48)
  - Support for standard Home Assistant tap action patterns
  - Actions: `more-info` (default), `toggle`, `call-service`, `navigate`, `url`, `none`
  - Fully backwards compatible (defaults to more-info)
  - Enables public dashboards, custom navigation, and service calls
- Configurable custom unit display
  - New `unit` option to override entity's `unit_of_measurement`
  - Leave unset to use entity's default unit
  - Set to empty string `""` to display no unit
  - Examples: `unit: " %"`, `unit: " pancakes/hour"`, `unit: "°F"`

### Fixed
- None/NaN detection bug now checks numeric value instead of formatted string (PR #46)
- Fixed typo: `nonestring` → `noneString` for consistent property naming
- Added error handling for missing/undefined entities to prevent crashes
- Card now logs warning and gracefully handles non-existent entities

### Changed
- Project forked as community continuation from [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card)
- Updated README with continuation notice and comprehensive documentation
- Renamed to "Big Number Card - Continued" for HACS distribution
- Added extensive code comments for maintainability

### Maintained from Original v0.0.6 (2022-01-31)
- Display large sensor values with customizable styling
- Severity-based background colors
- Progress bar visualization with min/max values
- Support for entity attributes
- Handling of None/offline states with custom text and styling
- Configurable scale, colors, and opacity

## Original Project History

The following versions were created by the original authors at [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card):

### [0.0.6] - 2022-01-31
- Last release from original maintainers

### [0.0.5] and earlier
- See original repository for complete history: https://github.com/custom-cards/bignumber-card

## Attribution

Original card created by [@ciotlosm](https://github.com/ciotlosm) and contributors. This continuation maintains their excellent work while adding community improvements.
