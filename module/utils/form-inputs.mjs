/**
 * Create an `<input type="checkbox">` element for a BooleanField.
 * @param {FormInputConfig<boolean>} config
 * @returns {HTMLInputElement}
 */
export function createCheckboxInput(field, config) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = field.fieldPath;
  for (let c of (config.classes ?? "").split(" ")) {
    input.classList.add(c);
  }
  if (config.value) input.setAttribute("checked", "");
  foundry.applications.fields.setInputAttributes(input, config);
  for (let key of Object.keys(config)) {
    if (key.startsWith("dataset-")) {
      input.dataset[`${key.substring(8)}`] = config[key];
    }
  }
  return input;
}

export function visualNumberInput(field, config) {
  const input = document.createElement("div");
  let classes = config.classes;
  classes = typeof classes === "string" ? classes.split(" ") : [];
  classes ||= [];
  classes.unshift("visual-numbered-input");
  input.className = classes.join(" ");

  const label = document.createElement("label");
  label.className = "input-title";
  label.innerHTML = game.i18n.localize(field.label);
  input.append(label);

  for (const i in [...Array(field.max).keys()]) {
    let value_amount = Number(i) + 1;
    const checked_input = document.createElement("input");
    checked_input.type = "checkbox";
    if (Number(config.value) >= value_amount)
      checked_input.setAttribute("checked", "");
    checked_input.setAttribute("data-action", "setVisualNumberField");
    checked_input.setAttribute("data-datapath", field.fieldPath);
    checked_input.setAttribute("data-amount", `${value_amount}`);
    input.append(checked_input);
  }

  if (config.additional_fields) {
    console.debug(config.additional_fields);
    input.innerHTML += config.additional_fields;
  }
  return input;
}
