const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
import * as utils from "../../utils/module.mjs";

export default class AtoriaItemSheet extends HandlebarsApplicationMixin(
  ItemSheetV2,
) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ["atoria", "item"],
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      onEditImage: AtoriaItemSheet._onEditImage,
      createSubItem: AtoriaItemSheet._createSubItem,
      deleteSubItem: AtoriaItemSheet._deleteSubItem,
      createItem: AtoriaItemSheet._createItem,
      editItem: AtoriaItemSheet._editItem,
      deleteItem: AtoriaItemSheet._deleteItem,
      expandSection: {
        handler: AtoriaItemSheet._expandSection,
        buttons: [0, 2],
      },
      toggleEffect: AtoriaItemSheet._toggleEffect,
      handleUsableActableModifier: AtoriaItemSheet._handleUsableActableModifier,
    },
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
  };

  expanded_section = [];

  static PARTS = {
    header: {
      template: "systems/atoria/templates/v2/commons_parts/simple-header.hbs",
    },

    actable: {
      template: "systems/atoria/templates/v2/items/parts/actable-sheet.hbs",
    },
    action_opportunity_pre: {
      template: "systems/atoria/templates/v2/items/parts/action-pre-sheet.hbs",
    },
    action_opportunity_post: {
      template: "systems/atoria/templates/v2/items/parts/action-post-sheet.hbs",
    },
    spell_pre: {
      template: "systems/atoria/templates/v2/items/parts/spell-pre-sheet.hbs",
    },
    spell_post: {
      template: "systems/atoria/templates/v2/items/parts/spell-post-sheet.hbs",
    },
    actable_modifier: {
      template:
        "systems/atoria/templates/v2/items/parts/actable-modifier-sheet.hbs",
    },

    inventory: {
      template: "systems/atoria/templates/v2/items/parts/inventory-sheet.hbs",
    },
    kit: {
      template: "systems/atoria/templates/v2/items/parts/kit-sheet.hbs",
    },
    armor: {
      template: "systems/atoria/templates/v2/items/parts/armor-sheet.hbs",
    },
    weapon: {
      template: "systems/atoria/templates/v2/items/parts/weapon-sheet.hbs",
    },

    feature: {
      template: "systems/atoria/templates/v2/items/parts/feature-sheet.hbs",
    },

    effects: {
      template: "systems/atoria/templates/v2/items/parts/effects.hbs",
    },
  };

  static async _onEditImage(_event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: "image",
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        target.src = path;
        return this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ["header"];

    switch (this.item.type) {
      case "feature":
        options.parts.push(this.item.type);
        break;
      case "kit":
        options.parts.push("inventory");
        options.parts.push(this.item.type);
        break;
      case "armor":
        options.parts.push("inventory");
        options.parts.push(this.item.type);
        break;
      case "weapon":
        options.parts.push("inventory");
        options.parts.push(this.item.type);
        break;
      case "action":
      case "opportunity":
        options.parts.push("action_opportunity_pre");
        options.parts.push("actable");
        options.parts.push("action_opportunity_post");
        break;
      case "spell":
        options.parts.push("spell_pre");
        options.parts.push("actable");
        options.parts.push("spell_post");
        break;
      case "technique":
      case "incantatory-addition":
        options.parts.push("actable_modifier");
        break;
    }

    if (this.document.limited) return;
    if (["feature", "kit", "armor", "weapon"].includes(this.document.type)) {
      options.parts.push("effects");
    }
  }

  async _prepareContext(options) {
    const context = {
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      gm: game.user.isGM,

      item: this.item,
      system: this.item.system,
      systemSource: this.item.system._source,
      flags: this.item.flags,

      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,

      inputs: foundry.applications.fields,
      atoria_inputs: utils.form_inputs,
    };

    return context;
  }

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "actable":
        context.hide_actable_modifiers = !(
          this.item.system.is_magic ?? this.item.type == "spell"
        );
        context.associated_saves_skills =
          this.actor?.getOpposedSkillList() ??
          utils.default_values.associated_skills;
        context.available_actable_modifiers =
          utils.ruleset.item.getActableModifiersApplicable(this.item);
        context.associated_skills =
          this.actor?.getSkillnKnowledgeList() ??
          foundry.utils.deepClone(utils.default_values.associated_skills);
        for (const matching_skills of Object.keys(context.associated_skills)) {
          for (const hidden_skill of this.actor?.getFlag(
            "atoria",
            "hidden_skills",
          ) ?? []) {
            if (matching_skills.startsWith(hidden_skill)) {
              delete context.associated_skills[matching_skills];
            }
          }
        }
        break;
      case "weapon":
        context.associated_saves_skills =
          this.actor?.getSkillnKnowledgeList() ??
          utils.default_values.associated_skills;
        context.available_actable_modifiers =
          utils.ruleset.item.getActableModifiersApplicable(this.item);
        context.associated_skills =
          this.actor?.getWeaponSkillList() ??
          utils.default_values.associated_skills;
        break;
      case "action_opportunity_pre":
      case "action_opportunity_post":
      case "feature":
        context.associated_skills =
          this.actor?.getSkillnKnowledgeList() ??
          foundry.utils.deepClone(utils.default_values.associated_skills);
        for (const matching_skills of Object.keys(context.associated_skills)) {
          for (const hidden_skill of this.actor?.getFlag(
            "atoria",
            "hidden_skills",
          ) ?? []) {
            if (matching_skills.startsWith(hidden_skill)) {
              delete context.associated_skills[matching_skills];
            }
          }
        }
        break;
      case "header":
        context.small_image = true;
        context.document = context.item;
        break;
      case "effects":
        context.effects = await Promise.all(
          this.item.effects.map(async (i) => {
            i.descriptive_tooltip = await renderTemplate(
              CONFIG.ATORIA.EFFECT_TOOLTIP_TEMPLATES,
              {
                effect: i,
              },
            );
            return i;
          }),
        );
        context.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
        context.isEditingMode = true; // Enable deletion of effect
        break;
    }
    return context;
  }

  static async _createSubItem(_event, target) {
    const { subElementPath } = target.dataset;
    await this.document?.addSubElement(subElementPath);
  }

  static async _deleteSubItem(_event, target) {
    const { subElementPath, subElementIndex } = target.dataset;
    await this.document?.deleteSubElement(subElementPath, subElementIndex);
    // if (effectId !== undefined) await this.document?.deleteEffect(effectId);
  }

  static async _createItem(_event, target) {
    const item_data = {};
    for (const [key, value] of Object.entries(target.dataset)) {
      // Ignore sheet-action related keys
      if (["action", "open"].includes(key)) continue;
      foundry.utils.setProperty(item_data, key, value);
    }
    const item = await this.document?.createEffect(item_data);
    if (target.dataset.open && item !== undefined) item.sheet.render(true);
  }

  static async _editItem(event, target) {
    const { effectId } = target.dataset;
    if (effectId !== undefined) await this.document?.editEffect(effectId);
  }

  static async _deleteItem(_event, target) {
    const { effectId } = target.dataset;
    if (effectId !== undefined) await this.document?.deleteEffect(effectId);
  }

  static async _expandSection(_event, expand_control) {
    // if (event.button != 2) return;
    const { expandId } = expand_control.dataset;

    if (!expandId) {
      console.warn("Undefined data-expand-id");
      return;
    }
    const $expand_control = $(expand_control);
    if ($expand_control.hasClass("expanded"))
      this.expanded_section.splice(this.expanded_section.indexOf(expandId), 1);
    else this.expanded_section.push(expandId);
    $expand_control.toggleClass("expanded");
  }

  static async _toggleEffect(_event, target) {
    const { effectId } = target.dataset;
    const effect = this.item.effects.get(effectId);
    if (!effect) {
      console.warn("Undefined effect-id");
      return;
    }
    await effect.update({
      disabled: !effect.disabled,
    });
  }

  static async _handleUsableActableModifier(_event, target) {
    const { actableModifierId } = target.dataset;
    if (target.checked) {
      this.item.enableActableModifier(actableModifierId);
    } else {
      this.item.disableActableModifier(actableModifierId);
    }
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#dragDrop.forEach((d) => d.bind(this.element));

    const html = $(this.element);

    html.find(".atoria-resize-ta").each(function (_idx, textarea) {
      const calculate_new_height = (scroll_height) => {
        return Math.max(22, Math.ceil((textarea.scrollHeight - 3) / 22) * 22);
      };

      textarea.style.height = "auto";
      textarea.style.height =
        calculate_new_height(textarea.scrollHeight) + "px";
      textarea.style.overflowY = "hidden";

      textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = calculate_new_height(this.scrollHeight) + "px";
      });
    });

    for (const id in this.expanded_section) {
      html
        .find(
          `.atoria-expand-control[data-expand-id="${this.expanded_section[id]}"]`,
        )
        .each((_idx, element) => {
          const $element = $(element);
          $element.addClass("expanded");
        });
    }

    if (!this.isEditable) return;
  }

  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  #dragDrop;

  get dragDrop() {
    return this.#dragDrop;
  }

  _canDragStart(selector) {
    return this.isEditable;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const li = event.currentTarget;
    if ("link" in event.target.dataset) return;

    let dragData = null;

    // Active Effect
    if (li.dataset.effectId) {
      const effect = this.item.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    }

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  _onDragOver(event) {}

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      default:
        console.log(`No drop data is handled, ${data.type}`);
        break;
    }
  }

  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass("ActiveEffect");
    const effect = await aeCls.fromDropData(data);
    if (!this.item.isOwner || !effect) return false;

    if (this.item.uuid === effect.parent?.uuid)
      return this._onEffectSort(event, effect);
    return aeCls.create(effect, { parent: this.item });
  }

  _onEffectSort(event, effect) {
    const effects = this.item.effects;
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = effects.get(dropTarget.dataset.effectId);

    // Don't sort on yourself
    if (effect.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      if (siblingId && siblingId !== effect.id)
        siblings.push(effects.get(el.dataset.effectId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.item.updateEmbeddedDocuments("ActiveEffect", updateData);
  }
}
