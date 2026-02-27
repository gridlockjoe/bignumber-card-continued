/* Last modified: 26-Feb-2026 */
class BigNumberCard extends HTMLElement {
  _DEFAULT_STYLE(){return 'var(--label-badge-blue)';}
  _DEFAULT_COLOR(){return 'var(--primary-text-color)';}

  static getConfigElement() {
    return document.createElement('bignumber-card-editor');
  }

  static getStubConfig() {
    return {
      entity: '',
      title: '',
      scale: '50px'
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }

    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);
    const cardConfig = Object.assign({}, config);
    if (!cardConfig.scale) cardConfig.scale = "50px";
    if (!cardConfig.from) cardConfig.from = "left";
    if (!cardConfig.opacity) cardConfig.opacity = "0.5";
    if (!cardConfig.noneString) cardConfig.noneString = null;
    if (!cardConfig.noneCardClass) cardConfig.noneCardClass = null;
    if (!cardConfig.noneValueClass) cardConfig.noneValueClass = null;

    // NEW: Custom unit support
    // Allows overriding entity's unit_of_measurement for display
    // If undefined, falls back to entity attribute (original behavior)
    if (cardConfig.unit === undefined) cardConfig.unit = null;

    // NEW: Custom font size support (PR #47 - issue #39)
    // Allows independent control of title and value font sizes separate from scale parameter
    // Defaults to null to maintain backwards compatibility with scale-based sizing
    if (!cardConfig.title_font_size) cardConfig.title_font_size = null;
    if (!cardConfig.value_font_size) cardConfig.value_font_size = null;

    // NEW: Custom card padding support (PR #47 - issue #39)
    // Decouples card height from font sizes for better layout control
    // Defaults to null to maintain backwards compatibility with scale-based padding
    if (!cardConfig.card_padding) cardConfig.card_padding = null;

    // Standardized color option names with backwards compatibility
    // fill_color: Bar fill color (new name for bnStyle)
    // text_color: Text color (new name for color)
    // background_color: Unfilled bar portion color
    // Old names (bnStyle, color) still work for backwards compatibility
    if (!cardConfig.fill_color) cardConfig.fill_color = null;
    if (!cardConfig.text_color) cardConfig.text_color = null;
    if (!cardConfig.background_color) cardConfig.background_color = null;

    // NEW: Tap action support (PR #48 - issue #41)
    // Defaults to more-info to maintain backwards compatibility with existing behavior
    if (!cardConfig.tap_action) {
      cardConfig.tap_action = { action: 'more-info' };
    }

    this.isNoneConfig = Boolean(cardConfig.noneString || cardConfig.noneCardClass || cardConfig.noneValueClass)

    const card = document.createElement('ha-card');
    // Gradient background is on a separate div, not on ha-card itself.
    // Some themes (e.g. Frosted Glass via card-mod) set ha-card { background: transparent }
    // asynchronously, which would wipe out a gradient placed directly on ha-card.
    // Using an inner div means the gradient is unaffected by theme background overrides.
    const bg = document.createElement('div');
    bg.id = "bg";
    const content = document.createElement('div');
    content.id = "value"
    const title = document.createElement('div');
    title.id = "title"
    title.textContent = cardConfig.title;

    // NEW: Calculate font sizes and padding with user overrides (PR #47 - issue #39)
    // If user provides custom values, use them; otherwise fall back to scale-based defaults
    // This allows users to set small card heights with large fonts, or vice versa
    const valueFontSize = cardConfig.value_font_size || 'calc(var(--base-unit) * 1.3)';
    const titleFontSize = cardConfig.title_font_size || 'calc(var(--base-unit) * 0.5)';
    const cardPadding = cardConfig.card_padding || 'calc(var(--base-unit)*0.6) calc(var(--base-unit)*0.3)';

    const style = document.createElement('style');
    style.textContent = `
      ha-card {
        text-align: center;
        position: relative;
        overflow: hidden;
        --bignumber-text-color: ${this._getTextColor(null, cardConfig)};
        --bignumber-fill-color: ${this._getFillColor(null, cardConfig)};
        --bignumber-background-color: ${this._getBackgroundColor(null, cardConfig)};
        --bignumber-percent: 100%;
        --bignumber-direction: ${cardConfig.from};
        --base-unit: ${cardConfig.scale};
        padding: ${cardPadding};
      }
      #bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        border-radius: inherit;
        background: linear-gradient(to var(--bignumber-direction), var(--bignumber-background-color) var(--bignumber-percent), var(--bignumber-fill-color) var(--bignumber-percent));
      }
      #value {
        font-size: ${valueFontSize};
        line-height: ${valueFontSize};
        color: var(--bignumber-text-color);
        position: relative;
        z-index: 1;
      }
      #value small{opacity: ${cardConfig.opacity}}
      #title {
        font-size: ${titleFontSize};
        line-height: ${titleFontSize};
        color: var(--bignumber-text-color);
        position: relative;
        z-index: 1;
      }
    `;
    card.appendChild(bg);
    card.appendChild(content);
    card.appendChild(title);
    card.appendChild(style);

    // NEW: Handle tap actions (PR #48 - issue #41)
    // Replaces hardcoded more-info with configurable tap action handler
    card.addEventListener('click', event => {
      this._handleTapAction(cardConfig.tap_action, cardConfig.entity);
    });

    root.appendChild(card);
    this._config = cardConfig;
  }

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  // NEW: Handle tap actions (PR #48 - issue #41)
  // Implements standard Home Assistant tap action behaviors:
  // - more-info: Show entity history popup (default)
  // - toggle: Toggle the entity state
  // - call-service: Call a Home Assistant service
  // - navigate: Navigate to a Lovelace view
  // - url: Open an external URL
  // - none: Do nothing (disable tap action)
  _handleTapAction(actionConfig, entityId) {
    if (!actionConfig || actionConfig.action === 'none') {
      return;
    }

    switch (actionConfig.action) {
      case 'more-info':
        this._fire('hass-more-info', { entityId: entityId });
        break;

      case 'toggle':
        this._toggleEntity(entityId);
        break;

      case 'call-service':
        if (actionConfig.service) {
          this._callService(actionConfig.service, actionConfig.service_data);
        }
        break;

      case 'navigate':
        if (actionConfig.navigation_path) {
          window.history.pushState(null, '', actionConfig.navigation_path);
          this._fire('location-changed', { replace: false });
        }
        break;

      case 'url':
        if (actionConfig.url_path) {
          window.open(actionConfig.url_path);
        }
        break;

      default:
        // Fall back to more-info for unknown actions
        this._fire('hass-more-info', { entityId: entityId });
    }
  }

  // NEW: Toggle entity helper (PR #48 - issue #41)
  // Calls the appropriate toggle service based on entity domain
  _toggleEntity(entityId) {
    const domain = entityId.split('.')[0];
    this._callService(`${domain}.toggle`, { entity_id: entityId });
  }

  // NEW: Call service helper (PR #48 - issue #41)
  // Fires the call-service event to Home Assistant
  _callService(service, serviceData) {
    const [domain, serviceAction] = service.split('.');
    this._fire('hass-call-service', {
      service: serviceAction,
      domain: domain,
      service_data: serviceData || {}
    });
  }

  _computeSeverity(stateValue, sections) {
    if (stateValue === undefined || stateValue === null) return;
    const numberValue = Number(stateValue);
    for (const section of sections) {
      if (numberValue <= section.value) return section;
    }
  }

  _getTextColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      // Check new name first, fall back to old name for backwards compatibility
      if (severity && (severity.text_color || severity.color)) {
        return severity.text_color || severity.color;
      }
    }
    // Check new name first, fall back to old name for backwards compatibility
    if (config.text_color || config.color) {
      return config.text_color || config.color;
    }
    return this._DEFAULT_COLOR();
  }

  _getFillColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      // Check new name first, fall back to old name (bnStyle) for backwards compatibility
      if (severity && (severity.fill_color || severity.bnStyle)) {
        return severity.fill_color || severity.bnStyle;
      }
    }
    // Check new name first, fall back to old name (bnStyle) for backwards compatibility
    if (config.fill_color || config.bnStyle) {
      return config.fill_color || config.bnStyle;
    }
    return this._DEFAULT_STYLE();
  }

  _getBackgroundColor(entityState, config) {
    if (config.severity) {
      const severity = this._computeSeverity(entityState, config.severity);
      if (severity && severity.background_color) return severity.background_color;
    }
    if (config.background_color) return config.background_color;
    return 'var(--card-background-color)';
  }

  _translatePercent(value, min, max) {
    return 100-100 * (value - min) / (max - min);
  }

  // NEW: Format numbers with locale-aware thousands separators (PR #46 - issue #45)
  // Uses toLocaleString() for automatic locale-based formatting
  // Respects config.round setting for decimal precision
  _formatNumber(value, config) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return value;
    }

    const options = {};
    if (config.round != null) {
      options.minimumFractionDigits = config.round;
      options.maximumFractionDigits = config.round;
    }

    return numValue.toLocaleString(undefined, options);
  }

  set hass(hass) {
    const config = this._config;
    const root = this.shadowRoot;

    // Check if entity exists to prevent crashes
    const entity = hass.states[config.entity];
    if (!entity) {
      console.warn(`BigNumberCard: Entity ${config.entity} not found`);
      return;
    }

    const entityState = config.attribute
      ? entity.attributes[config.attribute]
      : entity.state;
    // NEW: Support custom unit override
    // Priority: config.unit (if defined) → entity.attributes.unit_of_measurement → empty string
    const measurement = config.unit !== null ? config.unit : (entity.attributes.unit_of_measurement || "");

    if (entityState !== this._entityState) {
      if (config.min !== undefined && config.max !== undefined) {
        root.querySelector("ha-card").style.setProperty('--bignumber-percent', `${this._translatePercent(entityState, config.min, config.max)}%`);
      }
      root.querySelector("ha-card").style.setProperty('--bignumber-fill-color', `${this._getFillColor(entityState, config)}`);
      root.querySelector("ha-card").style.setProperty('--bignumber-text-color', `${this._getTextColor(entityState, config)}`);
      root.querySelector("ha-card").style.setProperty('--bignumber-background-color', `${this._getBackgroundColor(entityState, config)}`);
      this._entityState = entityState
      // NEW: Use locale-aware formatting (PR #46 - issue #45)
      const numValue = parseFloat(entityState);
      let value = this._formatNumber(entityState, config);
      if (config.hideunit==true)
        { root.getElementById("value").textContent = `${value}`; }
      else
        { root.getElementById("value").innerHTML = `${value}<small>${measurement}</small>`; }
      if (this.isNoneConfig){
        // NEW: Fixed None detection bug - check numeric value instead of formatted string (PR #46)
        if (isNaN(numValue)) {
          if (config.noneString) {
            root.getElementById("value").textContent = config.noneString;
          }
          if (config.noneCardClass) {
            root.querySelector("ha-card").classList.add(config.noneCardClass)
          }
          if (config.noneValueClass) {
            root.getElementById("value").classList.add(config.noneValueClass)
          }
        } else {
          root.querySelector("ha-card").classList.remove(config.noneCardClass)
          root.getElementById("value").classList.remove(config.noneValueClass)
        }
      }
    }
    root.lastChild.hass = hass;
  }

  getCardSize() {
    return 1;
  }
}

// Visual Editor for Big Number Card
// Uses ha-textfield for text inputs (maintains focus) and ha-selector for entity/select only
class BigNumberCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = { ...config };
    // Only render once initially, not on every config update from HA
    // This prevents destroying DOM elements and losing focus
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    // Update entity picker with hass reference
    const entityPicker = this.shadowRoot?.querySelector('ha-selector');
    if (entityPicker) {
      entityPicker.hass = hass;
    }
  }

  _fireConfigChanged() {
    const event = new CustomEvent('config-changed', {
      bubbles: true,
      composed: true,
      detail: { config: this._config }
    });
    this.dispatchEvent(event);
  }

  _valueChanged(field, value) {
    if (field.startsWith('tap_action.')) {
      const subField = field.replace('tap_action.', '');
      const newTapAction = { ...(this._config.tap_action || { action: 'more-info' }) };
      if (value === '' || value === undefined) {
        delete newTapAction[subField];
      } else {
        newTapAction[subField] = value;
      }
      this._config = { ...this._config, tap_action: newTapAction };
      // Re-render only for action type changes (shows/hides conditional fields)
      if (subField === 'action') {
        this._rendered = false;
        this.render();
        this._rendered = true;
      }
    } else {
      if (value === '' || value === undefined) {
        const newConfig = { ...this._config };
        delete newConfig[field];
        this._config = newConfig;
      } else {
        this._config = { ...this._config, [field]: value };
      }
    }
    this._fireConfigChanged();
  }

  _createTextfield(field, label, value, helperText, type = 'text') {
    const container = document.createElement('div');
    container.className = 'field';

    const textfield = document.createElement('ha-textfield');
    textfield.label = label;
    textfield.value = value ?? '';
    if (type === 'number') {
      textfield.type = 'number';
    }
    if (helperText) {
      textfield.helperPersistent = true;
      textfield.helper = helperText;
    }
    textfield.addEventListener('input', (e) => {
      const newValue = type === 'number' ?
        (e.target.value === '' ? undefined : Number(e.target.value)) :
        e.target.value;
      this._valueChanged(field, newValue);
    });

    container.appendChild(textfield);
    return container;
  }

  _createSwitch(field, label, checked) {
    const container = document.createElement('div');
    container.className = 'toggle-row';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;

    const toggle = document.createElement('ha-switch');
    toggle.checked = checked || false;
    toggle.addEventListener('change', (e) => {
      this._valueChanged(field, e.target.checked);
    });

    container.appendChild(labelEl);
    container.appendChild(toggle);
    return container;
  }

  _createEntityPicker(field, label, value) {
    const container = document.createElement('div');
    container.className = 'field';

    const selector = document.createElement('ha-selector');
    selector.hass = this._hass;
    selector.selector = { entity: {} };
    selector.value = value || '';
    selector.label = label;
    selector.addEventListener('value-changed', (e) => {
      this._valueChanged(field, e.detail.value);
    });

    container.appendChild(selector);
    return container;
  }

  _createSelect(field, label, value, options) {
    const container = document.createElement('div');
    container.className = 'field';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.className = 'select-label';

    const select = document.createElement('select');
    select.className = 'ha-select';
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      this._valueChanged(field, e.target.value);
    });

    container.appendChild(labelEl);
    container.appendChild(select);
    return container;
  }

  _createExpansionPanel(header, content) {
    const panel = document.createElement('ha-expansion-panel');
    panel.header = header;
    panel.outlined = true;
    panel.appendChild(content);
    return panel;
  }

  _createSeverityItem(index, sev) {
    const item = document.createElement('div');
    item.className = 'severity-item';

    // Value field
    const valueField = document.createElement('ha-textfield');
    valueField.label = 'Value';
    valueField.type = 'number';
    valueField.value = sev.value ?? '';
    valueField.addEventListener('input', (e) => {
      this._updateSeverity(index, 'value', e.target.value === '' ? undefined : Number(e.target.value));
    });

    // Fill color field (use new standard name, read from either for backwards compat)
    const fillField = document.createElement('ha-textfield');
    fillField.label = 'Fill Color';
    fillField.value = sev.fill_color || sev.bnStyle || '';
    fillField.addEventListener('input', (e) => {
      this._updateSeverity(index, 'fill_color', e.target.value);
    });

    // Text color field (use new standard name, read from either for backwards compat)
    const textField = document.createElement('ha-textfield');
    textField.label = 'Text Color';
    textField.value = sev.text_color || sev.color || '';
    textField.addEventListener('input', (e) => {
      this._updateSeverity(index, 'text_color', e.target.value);
    });

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-button';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      this._removeSeverity(index);
    });

    item.appendChild(valueField);
    item.appendChild(fillField);
    item.appendChild(textField);
    item.appendChild(removeBtn);
    return item;
  }

  _updateSeverity(index, key, value) {
    const severities = [...(this._config.severity || [])];
    severities[index] = { ...severities[index], [key]: value };
    // Remove empty values to keep config clean
    if (!value) {
      delete severities[index][key];
    }
    // Remove deprecated keys if new keys are being used
    if (key === 'fill_color') {
      delete severities[index].bnStyle;
    }
    if (key === 'text_color') {
      delete severities[index].color;
    }
    this._config = { ...this._config, severity: severities };
    this._fireConfigChanged();
  }

  _removeSeverity(index) {
    const severities = [...(this._config.severity || [])];
    severities.splice(index, 1);
    if (severities.length === 0) {
      const newConfig = { ...this._config };
      delete newConfig.severity;
      this._config = newConfig;
    } else {
      this._config = { ...this._config, severity: severities };
    }
    this._fireConfigChanged();
    // Rebuild just the severity list, not the whole editor
    this._rebuildSeverityList();
  }

  _rebuildSeverityList() {
    const severityList = this.shadowRoot?.querySelector('.severity-list');
    if (!severityList) return;

    // Clear existing items
    severityList.innerHTML = '';

    // Rebuild items with correct indices
    const severities = this._config.severity || [];
    severities.forEach((sev, index) => {
      severityList.appendChild(this._createSeverityItem(index, sev));
    });
  }

  render() {
    if (!this.shadowRoot) return;

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        padding: 16px;
      }
      .field {
        display: block;
        margin-bottom: 16px;
      }
      .field ha-textfield,
      .field ha-selector {
        display: block;
        width: 100%;
      }
      ha-expansion-panel {
        display: block;
        margin-bottom: 8px;
      }
      .panel-content {
        padding: 12px;
      }
      .section-note {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 12px;
        font-style: italic;
      }
      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }
      .toggle-row label {
        font-size: 14px;
        color: var(--primary-text-color);
      }
      h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
      }
      .select-label {
        display: block;
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 4px;
      }
      .ha-select {
        display: block;
        width: 100%;
        padding: 8px 12px;
        font-size: 14px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color);
        cursor: pointer;
      }
      .ha-select:focus {
        outline: none;
        border-color: var(--primary-color);
      }
      .severity-list {
        margin-bottom: 12px;
      }
      .severity-item {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
        align-items: end;
      }
      .severity-item ha-textfield {
        display: block;
      }
      .add-button, .remove-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .add-button {
        background-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
        width: 100%;
      }
      .add-button:hover {
        opacity: 0.9;
      }
      .remove-button {
        background-color: var(--error-color, #db4437);
        color: white;
        padding: 8px 12px;
      }
      .remove-button:hover {
        opacity: 0.9;
      }
    `;

    const root = document.createElement('div');

    // Section 1: Basic (always visible)
    const basicSection = document.createElement('div');
    basicSection.innerHTML = '<h3>Basic Settings</h3>';

    basicSection.appendChild(this._createEntityPicker('entity', 'Entity', this._config.entity));
    basicSection.appendChild(this._createTextfield('title', 'Title', this._config.title));

    root.appendChild(basicSection);

    // Section 2: Display Options
    const displayContent = document.createElement('div');
    displayContent.className = 'panel-content';

    displayContent.appendChild(this._createTextfield('attribute', 'Attribute (optional)', this._config.attribute, 'Display entity attribute instead of state'));
    displayContent.appendChild(this._createSwitch('hideunit', 'Hide unit of measurement', this._config.hideunit));
    displayContent.appendChild(this._createTextfield('round', 'Decimal places', this._config.round, 'Number of decimal places (0-10)', 'number'));
    displayContent.appendChild(this._createTextfield('unit', 'Custom unit', this._config.unit, 'Override entity unit of measurement'));

    root.appendChild(this._createExpansionPanel('Display Options', displayContent));

    // Section 3: Colors
    const colorsContent = document.createElement('div');
    colorsContent.className = 'panel-content';

    const colorNote = document.createElement('div');
    colorNote.className = 'section-note';
    colorNote.textContent = 'Use hex colors (#FF0000) or CSS variables (var(--primary-color))';
    colorsContent.appendChild(colorNote);

    colorsContent.appendChild(this._createTextfield('text_color', 'Text color', this._config.text_color || this._config.color));
    colorsContent.appendChild(this._createTextfield('fill_color', 'Fill color (bar/background)', this._config.fill_color || this._config.bnStyle));
    colorsContent.appendChild(this._createTextfield('background_color', 'Background color (unfilled portion)', this._config.background_color));
    colorsContent.appendChild(this._createTextfield('opacity', 'Unit text opacity', this._config.opacity || '0.5', 'Value between 0 and 1'));

    root.appendChild(this._createExpansionPanel('Colors', colorsContent));

    // Section 4: Sizing
    const sizingContent = document.createElement('div');
    sizingContent.className = 'panel-content';

    const sizingNote = document.createElement('div');
    sizingNote.className = 'section-note';
    sizingNote.textContent = 'Use CSS units (e.g., 50px, 2em, 1.5rem)';
    sizingContent.appendChild(sizingNote);

    sizingContent.appendChild(this._createTextfield('scale', 'Scale (base unit)', this._config.scale || '50px'));
    sizingContent.appendChild(this._createTextfield('value_font_size', 'Value font size', this._config.value_font_size));
    sizingContent.appendChild(this._createTextfield('title_font_size', 'Title font size', this._config.title_font_size));
    sizingContent.appendChild(this._createTextfield('card_padding', 'Card padding', this._config.card_padding));

    root.appendChild(this._createExpansionPanel('Sizing', sizingContent));

    // Section 5: Progress Bar
    const progressContent = document.createElement('div');
    progressContent.className = 'panel-content';

    const progressNote = document.createElement('div');
    progressNote.className = 'section-note';
    progressNote.textContent = 'Set min and max to enable progress bar display';
    progressContent.appendChild(progressNote);

    progressContent.appendChild(this._createTextfield('min', 'Minimum value', this._config.min, null, 'number'));
    progressContent.appendChild(this._createTextfield('max', 'Maximum value', this._config.max, null, 'number'));
    progressContent.appendChild(this._createSelect('from', 'Fill direction', this._config.from || 'left', [
      { value: 'left', label: 'Left to Right' },
      { value: 'right', label: 'Right to Left' },
      { value: 'top', label: 'Top to Bottom' },
      { value: 'bottom', label: 'Bottom to Top' }
    ]));

    root.appendChild(this._createExpansionPanel('Progress Bar', progressContent));

    // Section 6: None State Handling
    const noneContent = document.createElement('div');
    noneContent.className = 'panel-content';

    const noneNote = document.createElement('div');
    noneNote.className = 'section-note';
    noneNote.textContent = 'Configure display when sensor value is unavailable or NaN';
    noneContent.appendChild(noneNote);

    noneContent.appendChild(this._createTextfield('noneString', 'Display text when unavailable', this._config.noneString, 'e.g., Offline, N/A'));
    noneContent.appendChild(this._createTextfield('noneCardClass', 'Card CSS class when unavailable', this._config.noneCardClass));
    noneContent.appendChild(this._createTextfield('noneValueClass', 'Value CSS class when unavailable', this._config.noneValueClass));

    root.appendChild(this._createExpansionPanel('None State Handling', noneContent));

    // Section 7: Tap Action
    const tapContent = document.createElement('div');
    tapContent.className = 'panel-content';

    const tapAction = this._config.tap_action || { action: 'more-info' };

    tapContent.appendChild(this._createSelect('tap_action.action', 'Tap action', tapAction.action || 'more-info', [
      { value: 'more-info', label: 'More Info (default)' },
      { value: 'toggle', label: 'Toggle' },
      { value: 'call-service', label: 'Call Service' },
      { value: 'navigate', label: 'Navigate' },
      { value: 'url', label: 'Open URL' },
      { value: 'none', label: 'None (disabled)' }
    ]));

    // Conditional fields based on action type
    if (tapAction.action === 'navigate') {
      tapContent.appendChild(this._createTextfield('tap_action.navigation_path', 'Navigation path', tapAction.navigation_path, 'e.g., /lovelace/0'));
    }

    if (tapAction.action === 'url') {
      tapContent.appendChild(this._createTextfield('tap_action.url_path', 'URL', tapAction.url_path));
    }

    if (tapAction.action === 'call-service') {
      tapContent.appendChild(this._createTextfield('tap_action.service', 'Service', tapAction.service, 'e.g., light.toggle'));
      const serviceDataNote = document.createElement('div');
      serviceDataNote.className = 'section-note';
      serviceDataNote.textContent = 'For service_data, use YAML editor';
      tapContent.appendChild(serviceDataNote);
    }

    root.appendChild(this._createExpansionPanel('Tap Action', tapContent));

    // Section 8: Severity Levels
    const severityContent = document.createElement('div');
    severityContent.className = 'panel-content';

    const severityNote = document.createElement('div');
    severityNote.className = 'section-note';
    severityNote.textContent = 'Define color thresholds. Colors apply when value is <= the threshold. List in ascending order.';
    severityContent.appendChild(severityNote);

    const severityList = document.createElement('div');
    severityList.className = 'severity-list';

    const severities = this._config.severity || [];
    severities.forEach((sev, index) => {
      severityList.appendChild(this._createSeverityItem(index, sev));
    });

    severityContent.appendChild(severityList);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-button';
    addBtn.textContent = 'Add Severity Level';
    addBtn.addEventListener('click', () => {
      const newSev = { value: 0, fill_color: '#cccccc' };
      const newSeverity = [...(this._config.severity || []), newSev];
      this._config = { ...this._config, severity: newSeverity };
      this._fireConfigChanged();
      // Add new item to DOM without full re-render
      const newIndex = newSeverity.length - 1;
      severityList.appendChild(this._createSeverityItem(newIndex, newSev));
    });
    severityContent.appendChild(addBtn);

    root.appendChild(this._createExpansionPanel('Severity Levels', severityContent));

    // Clear and render
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(root);
  }
}

customElements.define('bignumber-card-editor', BigNumberCardEditor);
customElements.define('bignumber-card', BigNumberCard);

// Configure the preview in the Lovelace card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'bignumber-card',
  name: 'Big number card',
  preview: true,
  description: 'A simple card to display big numbers for sensors. It also supports severity levels as background.'
});
