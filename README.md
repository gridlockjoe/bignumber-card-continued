# Big Number Card - Continued

![GitHub Release](https://img.shields.io/github/v/release/sxdjt/bignumber-card-continued?style=for-the-badge)
[![AI Assisted](https://img.shields.io/badge/AI-Claude%20Code-AAAAAA.svg?style=for-the-badge)](https://claude.ai/code)
![GitHub License](https://img.shields.io/github/license/sxdjt/bignumber-card-continued?style=for-the-badge)

IMPORTANT: This is a community-maintained continuation of the original [bignumber-card](https://github.com/custom-cards/bignumber-card) by [@ciotlosm](https://github.com/ciotlosm).


## About This Continuation

This is a community-maintained continuation of the original [bignumber-card](https://github.com/custom-cards/bignumber-card) by [@ciotlosm](https://github.com/ciotlosm). The original authors deserve full credit for the excellent foundation they created.

## Documentation

A simple card to display big numbers for sensors. It also supports severity levels as background.

<img width="1029" height="164" alt="Screenshot 2026-01-14 at 09 28 25" src="https://github.com/user-attachments/assets/a26b52f9-4164-459d-b32e-fd4feb2949ce" />

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=bignumber-card-continued)

## Configuration Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:bignumber-card`
| attribute | string | optional | the entity attribute you want to display e.g. `current_temperature`.  The entity state will be shown if not defined.
| background_color | string | `var(--card-background-color)` | Unfilled bar portion color. Can be hex or HA variable
| card_padding | string | optional | Custom card padding (e.g., "20px 10px"). Allows independent height control
| entity | string | **Required** | `sensor.my_temperature`
| fill_color | string | `var(--label-badge-blue)` | Bar fill color. Can be hex or HA variable. Example: `var(--label-badge-green)`
| from | string | left | Direction from where the bar will start filling (must have min/max specified)
| hideunit | boolean | optional | hide the unit of measurement if set to true. If absent, unit of measurement will be shown
| max | number | optional | Maximum value. Must be specified if you added min
| min | number | optional | Minimum value. If specified you get bar display
| noneCardClass | string | optional | CSS class to add to card if value == None
| noneString | string | optional | String to use for value if value == None
| noneValueClass | string | optional | CSS class to add to value if value == None
| round | int | optional | Number of decimals to round to. (If not present, do not round.)
| scale | string | 50px | Base scale for card: '50px'
| severity | list | optional | A list of severity objects. Items in list must be ascending based on 'value'
| tap_action | object | `{action: 'more-info'}` | Action to perform on tap. See Tap Action Object below
| text_color | string | `var(--primary-text-color)` | Text color. Can be hex or HA variable. Example: `var(--secondary-text-color)`
| title | string | optional | Name to display on card
| title_font_size | string | optional | Custom font size for title (e.g., "14px", "1rem"). Overrides scale-based sizing
| unit | string | optional | Custom unit to display instead of entity's unit_of_measurement. Leave unset to use entity unit. Set to empty string "" to force no unit. Examples: " %", " pancakes/hour", "°F"
| value_font_size | string | optional | Custom font size for value (e.g., "30px", "2rem"). Overrides scale-based sizing

#### Deprecated Option Names (Still Supported)

For backwards compatibility, the following option names still work but the new names above are preferred:

| Deprecated | Use Instead |
| ---------- | ----------- |
| color | text_color |
| bnStyle | fill_color |

### Severity Object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| value | number | **Required** | Value until which to use this severity
| fill_color | string | **Required** | Bar fill color. Can be hex or HA variable. Example: `var(--label-badge-green)`
| background_color | string | inherited | Unfilled bar portion color. Can be hex or HA variable
| text_color | string | `var(--primary-text-color)` | Text color. Can be hex or HA variable. Example: `var(--secondary-text-color)`

The deprecated names `bnStyle` and `color` also work in severity objects for backwards compatibility.

### Tap Action Object

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| action | string | `more-info` | Action type: `more-info`, `toggle`, `call-service`, `navigate`, `url`, `none`
| navigation_path | string | optional | Path to navigate to (e.g., `/lovelace/1`) when action is `navigate`
| service | string | optional | Service to call when action is `call-service` (e.g., `light.turn_on`)
| service_data | object | optional | Service data to pass when action is `call-service`
| url_path | string | optional | URL to open when action is `url`

### Important Notes

- Numbers are automatically formatted with locale-aware thousands separators (e.g., 19,578 in US, 19.578 in German)
- Font sizes can be customized independently from the `scale` parameter for better layout control
- Make sure you use ascending object values to have consistent behaviour
- Values are the upper limit until which that severity is applied

## Examples

### Basic Example with Severity

```yaml
- type: custom:bignumber-card
  title: Humidity
  entity: sensor.outside_humidity
  from: bottom
  min: 0
  max: 100
  hideunit: true
  text_color: '#000000'
  fill_color: var(--label-badge-blue)
  severity:
    - value: 70
      fill_color: var(--label-badge-green)
    - value: 90
      fill_color: var(--label-badge-yellow)
    - value: 100
      fill_color: var(--label-badge-red)
      text_color: '#FFFFFF'
```

### Custom Background Color Example

Control the unfilled bar portion color globally or per-severity:

```yaml
- type: custom:bignumber-card
  title: VOC Level
  entity: sensor.voc_index
  min: 0
  max: 300
  from: bottom
  hideunit: true
  background_color: '#222222'
  severity:
    - value: 50
      fill_color: var(--label-badge-green)
    - value: 150
      fill_color: var(--label-badge-yellow)
      text_color: '#FF0000'
      background_color: '#333333'
    - value: 200
      fill_color: var(--label-badge-orange)
    - value: 300
      fill_color: var(--label-badge-red)
      background_color: '#440000'
```

### Handling None Values

If your sensor may result in `None` (for instance if it is offline), you may wish to handle that separately. Here is an example, which uses [card-mod](https://github.com/thomasloven/lovelace-card-mod) to add special styling for the `None` case.

```yaml
- type: custom:bignumber-card
  title: Humidity
  entity: sensor.outside_humidity
  scale: 30px
  from: bottom
  min: 0
  max: 100
  text_color: '#000000'
  fill_color: var(--label-badge-blue)
  severity:
    - value: 70
      fill_color: var(--label-badge-green)
    - value: 90
      fill_color: var(--label-badge-yellow)
    - value: 100
      fill_color: var(--label-badge-red)
      text_color: '#FFFFFF'
  noneString: Offline
  noneCardClass: none-card-class
  noneValueClass: none-value-class
  style: |
    .none-card-class {
      background-color: yellow;
    }
    .none-value-class {
      font-size: 22px !important;
    }
```

### Custom Font Sizes Example

Customize font sizes independently from card scale:

```yaml
- type: custom:bignumber-card
  title: Temperature
  entity: sensor.living_room_temperature
  scale: 30px
  title_font_size: 12px
  value_font_size: 48px
  card_padding: 15px 10px
```

### Tap Action Examples

Toggle a light on tap:

```yaml
- type: custom:bignumber-card
  title: Power Usage
  entity: sensor.power_consumption
  tap_action:
    action: toggle
```

Navigate to another view:

```yaml
- type: custom:bignumber-card
  title: Temperature
  entity: sensor.outside_temperature
  tap_action:
    action: navigate
    navigation_path: /lovelace/climate
```

Call a service with data:

```yaml
- type: custom:bignumber-card
  title: Volume
  entity: sensor.media_volume
  tap_action:
    action: call-service
    service: media_player.volume_set
    service_data:
      entity_id: media_player.living_room
      volume_level: 0.5
```
## Contributing

Contributions are welcome! Please feel free to submit pull requests or [open an issue](https://github.com/sxdjt/bignumber-card-continued/issues) for bugs and feature requests.

## Credits

Original card created by [@ciotlosm](https://github.com/ciotlosm) and contributors to [custom-cards/bignumber-card](https://github.com/custom-cards/bignumber-card).

This continuation is maintained by the community to keep the card compatible with modern Home Assistant versions.

## License

Apache-2.0 License - See [LICENSE](LICENSE) file for details
