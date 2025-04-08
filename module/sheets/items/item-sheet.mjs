
export default class AtoriaItemSheetV1 extends ItemSheet {

    textarea_line_count = {};
    expanded_section = [];

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["atoria", "sheet", "item"],
            width: 450,
            height: 350,
            tabs: [],
        });
    }

    get template() {
        if (["technique", "incantatory-addition"].includes(this.item.type))
            return `systems/atoria/templates/items/item-actable-modifier-sheet.hbs`;
        return `systems/atoria/templates/items/item-${this.item.type}-sheet.hbs`;
    }


    async getData() {
        const context = super.getData();

        const actorData = this.document.toPlainObject();
        context.flags = actorData.flags;
        context.fields = this.document.schema.fields;
        context.systemFields = this.document.system.schema.fields;

        context.textarea_line_count = this.textarea_line_count;

        const item_types_with_associated_skill = ["feature", "action", "opportunity"];
        if (item_types_with_associated_skill.includes(this.item.type)) {
            context.associated_skills = this.actor?.getSkillnKnowledgeList() ?? {};
        }
        const item_types_with_associated_combative_skill = ["weapon"];
        if (item_types_with_associated_combative_skill.includes(this.item.type)) {
            context.associated_skills = this.actor?.getWeaponSkillList() ?? {};
        }

        const item_types_with_actable_modifiers = ["weapon", "action", "spell"];
        if (item_types_with_actable_modifiers.includes(this.item.type)) {
            const want_technique = (this.item.type === "weapon" || (this.item.type === "action" && !this.item.system.is_magic));
            const want_incantatory = (this.item.type === "spell" || (this.item.type === "action" && this.item.system.is_magic));
            context.available_actable_modifiers = this.actor?.getActableModifierList(want_technique, want_incantatory);
        }
        const item_types_with_saves_asked = ["action", "opportunity", "spell"];
        if (item_types_with_saves_asked.includes(this.item.type)) {
            context.associated_saves_skills = this.actor?.getSkillList() ?? {};
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

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


        html.on("click", ".sub-element-control", (event) => {
            event.preventDefault();
            const button = event.currentTarget;
            const { action } = button.dataset;

            const element_category_element = button.closest(".sub-element-category");
            const { path } = element_category_element.dataset;

            this.item.handleSubElement(action, path, button.dataset);
        });

        html.on("click", ".actable-modifier-toggle", (event) => {
            event.preventDefault();
            const checkbox = event.currentTarget;
            const { actableModifierId } = checkbox.dataset;
            if (checkbox.checked) {
                this.item.handleUsableActableModifier("add", actableModifierId);
            }
            else {
                this.item.handleUsableActableModifier("remove", actableModifierId);
            }
        });

        html.on("input", ".resize-ta", (event) => {
            event.preventDefault();
            const textarea = event.currentTarget;
            const { name } = textarea.dataset;
            this._updateTextareaLineCount(name, textarea.value);
            textarea.style = `min-height: calc(2px + ${this.textarea_line_count[name]}lh)`;
        });
        html.find(".resize-ta").each((idx, element) => {
            const { name } = element.dataset;
            this._updateTextareaLineCount(name, element.value);
            element.style = `min-height: calc(2px + ${this.textarea_line_count[name]}lh)`;
        });
    }

    _updateTextareaLineCount(key, text) {
        let numberOfLineBreaks = 1 + (text.match(/&#10;/g) || []).concat(text.match(/\n/g) || []).length;
        this.textarea_line_count[key] = numberOfLineBreaks
    }
}