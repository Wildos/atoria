

export function buildLocalizeString(...desired_path_steps) {
    return `ATORIA.${desired_path_steps.map((elem) => elem.charAt(0).toUpperCase() + elem.slice(1).toLowerCase()).join(".")}`;
}