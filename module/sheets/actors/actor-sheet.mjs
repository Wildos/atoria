
export default class AtoriaActorSheet extends ActorSheet {
    isEditingMode = false;

    textarea_line_count = {};
    expanded_section = [];

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["atoria", "sheet", "actor"],
            width: 720,
            height: 600,
            tabs: [],
        });
    }

    get template() {
        return `systems/atoria/templates/actors/actor-${this.actor.type}-sheet.hbs`;
    }

    async getData() {
        const context = super.getData();

        const actorData = this.document.toPlainObject();
        context.flags = actorData.flags;
        context.fields = this.document.schema.fields;
        context.systemFields = this.document.system.schema.fields;

        context.isEditingMode = this.isEditingMode;
        context.textarea_line_count = this.textarea_line_count;

        await this._prepareItems(context);
        this._prepareCharacterData(context);

        return context;
    }

    async _prepareItems(context) {
        for (let i of context.items) {
            // i.descriptive_tooltip = await this.actor.items.get(i._id).getTooltipHTML();
            i.systemFields = this.actor.items.get(i._id).system.schema.fields;
        }
    }

    _prepareCharacterData(context) {

    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on("click", ".rollable", (event) => {
            event.preventDefault();
            const skill_title = event.currentTarget;
            const { skillPath, itemId } = skill_title.dataset;
            if (skillPath !== undefined) this.actor.rollSkill(skillPath);
            else if (itemId !== undefined) this.actor.items.get(itemId).rollAction();
        });

        if (!this.isEditable) return;

        html.on("click", ".editable-control", (event) => {
            event.preventDefault();
            const checkbox = event.currentTarget;
            this.isEditingMode = checkbox.checked;
            this.render();
        });

        html.on("click", ".expand-control", (event) => {
            event.preventDefault();
            const $control_element = $(event.currentTarget);
            const { expandId } = event.currentTarget.dataset;
            if (expandId === undefined) {
                console.warn("Undefined data-expand-id");
                return;
            }
            if ($control_element.hasClass("expanded")) this.expanded_section.splice(this.expanded_section.indexOf(expandId), 1);
            else this.expanded_section.push(expandId);
            $control_element.toggleClass("expanded");
        });
        for (const id in this.expanded_section) {
            html.find(`.expand-control[data-expand-id="${this.expanded_section[id]}"]`).each((idx, element) => {
                const $element = $(element);
                $element.addClass("expanded");
                $element.style = "background-color: red;";
            });
        }

        html.on("input", ".resize-ta", (event) => {
            event.preventDefault();
            const textarea = event.currentTarget;
            const { name } = textarea.dataset;
            this._updateTextareaLineCount(name, textarea.value);
            textarea.style = `min-height: calc(2px + ${this.textarea_line_count[name]}lh)`;
        });

        html.on("click", ".item-control", (event) => {
            event.preventDefault();
            const current_target = event.currentTarget;
            const { action, type } = current_target.dataset;
            const row = current_target.closest("li.item");
            const item_id = (row !== null) ? row.dataset.itemId : null;
            this.actor.manageItem(action, type, item_id);
        });

        html.on("change", ".item-update", (event) => {
            event.preventDefault();
            const current_target = event.currentTarget;
            const { arrayPath, arrayIndex, name } = current_target.dataset;
            const row = current_target.closest("li.item");
            const item_id = (row !== null) ? row.dataset.itemId : null;
            const desired_value = (current_target.type === "checkbox") ? current_target.checked : current_target.value;
            this.actor.updateItem(item_id, name, desired_value, arrayPath, arrayIndex);
        });
        this._disableAttributesChangedByActiveEffect(html);
    }

    _disableAttributesChangedByActiveEffect(html) {
        for (const attribute_path of Object.keys(foundry.utils.flattenObject(this.actor.overrides))) {
            html.find(`input[name="${attribute_path}"]:not(:disabled),select[name="${attribute_path}"]`).each((idx, element) => {
                element.disabled = true;
                element.dataset.tooltip = game.i18n.format("ATORIA.Sheet.Disabled_by_active_effect", { tooltip: game.i18n.localize(element.dataset.tooltip) });
            });
        }
    }


    _updateTextareaLineCount(key, text) {
        let numberOfLineBreaks = 1 + (text.match(/&#10;/g) || []).concat(text.match(/\n/g) || []).length;
        this.textarea_line_count[key] = numberOfLineBreaks
    }

}