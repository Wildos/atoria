export const preloadHandlebarsTemplates = async function () {
  // const commons_partials = [
  //     "simple-header.hbs",
  //     "rollfield.hbs"
  // ]
  // const actors_partials = [
  //     "skill-display.hbs",
  //     "skill-cat-display.hbs",
  //     "skill-group-display.hbs",
  //     "skill-type-display.hbs",
  //     "armor-display.hbs",
  //     "resistance-display.hbs"
  // ];
  // const items_partials = [
  //     "inventory-item-display.hbs",
  //     "feature-item-display.hbs",
  //     "actable-item-display.hbs",
  //     "actable-modifier-item-display.hbs",
  //     "limitation-input.hbs",
  //     "keywords-input.hbs",
  //     "cost-input.hbs",
  //     "supplementary-input.hbs"
  // ];
  // const tooltips_partials = [
  //     "cost-tooltip.hbs",
  //     "limitation-tooltip.hbs",
  // ];
  // for (const path of commons_partials) {
  //     paths[`atoria.commons.${path.replace(".hbs", "")}`] = `systems/atoria/templates/commons/${path}`;
  // }
  // for (const path of actors_partials) {
  //     paths[`atoria.actors_partials.${path.replace(".hbs", "")}`] = `systems/atoria/templates/actors/parts/${path}`;
  // }
  // for (const path of items_partials) {
  //     paths[`atoria.items_partials.${path.replace(".hbs", "")}`] = `systems/atoria/templates/items/parts/${path}`;
  // }
  // for (const path of tooltips_partials) {
  //     paths[`atoria.tooltips_partials.${path.replace(".hbs", "")}`] = `systems/atoria/templates/tooltips/parts/${path}`;
  // }

  const paths = {};
  const v2_commons_partials = [
    "simple-header.hbs",
    "attribute-display.hbs",
    "cost-display.hbs",
    "cost-input.hbs",
    "time-limitation-display.hbs",
    "time-limitation-input.hbs",
    "rollfield-input.hbs",
    "rollfield-display.hbs",
  ];
  const v2_actors_partials = [
    "effect-line-display.hbs",
    "item-line-display.hbs",
    "item-inventory-line-display.hbs",
    "item-actable-line-display.hbs",
    "item-actable-modifier-line-display.hbs",
    "item-feature-line-display.hbs",
    "item-effect-line-display.hbs",
    "coins-display.hbs",
    "skill-display.hbs",
    "skill-cat-display.hbs",
    "skill-group-display.hbs",
    "skill-type-display.hbs",
    "armor-display.hbs",
    "resistance-display.hbs",
    "item-header-bar.hbs",
  ];
  const v2_items_partials = ["skill-alteration-input.hbs"];
  const v2_tooltips_partials = [
    "cost-tooltip.hbs",
    "time-limitation-tooltip.hbs",
  ];
  const v2_chat_message_partials = [
    "related-items.hbs",
    "used-features.hbs",
    "used-actable-modifiers.hbs",
    "used-supplementaries.hbs",
  ];
  for (const path of v2_commons_partials) {
    paths[`atoria.v2.commons_partials.${path.replace(".hbs", "")}`] =
      `systems/atoria/templates/v2/commons_parts/${path}`;
  }
  for (const path of v2_actors_partials) {
    paths[`atoria.v2.actors_partials.${path.replace(".hbs", "")}`] =
      `systems/atoria/templates/v2/actors/parts/${path}`;
  }
  for (const path of v2_items_partials) {
    paths[`atoria.v2.items_partials.${path.replace(".hbs", "")}`] =
      `systems/atoria/templates/v2/items/parts/${path}`;
  }
  for (const path of v2_tooltips_partials) {
    paths[`atoria.v2.tooltips_partials.${path.replace(".hbs", "")}`] =
      `systems/atoria/templates/v2/tooltips/parts/${path}`;
  }
  for (const path of v2_chat_message_partials) {
    paths[`atoria.v2.chat_messages_partials.${path.replace(".hbs", "")}`] =
      `systems/atoria/templates/v2/chat_messages/parts/${path}`;
  }

  return loadTemplates(paths);
};

function _cleanLines(text) {
  text = Handlebars.Utils.escapeExpression(text);
  text = text.replace(/(\r\n|\n|\r)/gm, "&#10;");
  return new Handlebars.SafeString(text);
}

function _isEmpty(element) {
  if (Array.isArray(element)) return element.length === 0;
  if (typeof element === "string" || element instanceof String)
    return element.length === "";
  if (element !== null && typeof element === "object")
    return Object.keys(element).length === 0;
  return element === null || element === undefined;
}

function _percentage(number_a, number_b) {
  if (Number(number_b) === 0) return 0;
  const percentage = (Number(number_a) / Number(number_b)) * 100.0;
  return Math.clamp(percentage, 0.0, 100.0);
}

function _getProperty(object, property_path) {
  return foundry.utils.getProperty(
    object,
    property_path.string ?? property_path,
  );
}

function _includes(array, element) {
  if (!array) return false;
  element = typeof element === "string" ? element : element.string;
  return array.includes(element);
}

function _enhancedNumberFormat(value, options) {
  const originalValue = value;
  const dec = options.hash.decimals ?? 0;
  const sign = options.hash.sign || false;
  if (typeof value === "string" || value == null) value = parseFloat(value);
  if (Number.isNaN(value)) {
    console.warn("An invalid value was passed to enhancedNumberFormat:", {
      originalValue,
      valueType: typeof originalValue,
      options,
    });
  }
  let strVal =
    sign && value >= 0 ? `+${+value.toFixed(dec)}` : +value.toFixed(dec);
  return new Handlebars.SafeString(strVal);
}

function _oneOf(value, ...options) {
  options.pop();
  const validValues = options;
  return validValues.includes(value);
}

function _tooltipToDataset(tooltip) {
  return {
    tooltip,
  };
}

function _readonly(value) {
  if (value) return Handlebars.SafeString('readonly="readonly"');
  return "";
}

function _sum(...args) {
  args.pop();
  return args.reduce((elem, acc) => acc + elem, 0);
}

function _arraytize(...args) {
  args.pop();
  return args;
}

function _boolDictToString(dict) {
  const active_keys = [];
  for (let key of Object.keys(dict)) {
    if (dict[key]) active_keys.push(key);
  }
  return active_keys.join(", ");
}

function _pluralize(localize_string, amount) {
  const result_string = localize_string + (amount > 1 ? "_pl" : "");
  return result_string;
}

function _split(string, delimiter) {
  return string.split(delimiter);
}

export const registerHandlebarsHelpers = async function () {
  Handlebars.registerHelper({
    cleanLines: _cleanLines,
    isEmpty: _isEmpty,
    percentage: _percentage,
    getProperty: _getProperty,
    includes: _includes,
    enhancedNumberFormat: _enhancedNumberFormat,
    oneOf: _oneOf,
    tooltipToDataset: _tooltipToDataset,
    readonly: _readonly,
    sum: _sum,
    arraytize: _arraytize,
    boolDictToString: _boolDictToString,
    pluralize: _pluralize,
    split: _split,
  });
};
