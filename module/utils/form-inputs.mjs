
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
