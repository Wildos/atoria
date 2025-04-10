import * as utils from "../../utils/module.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

function hasPopoutV2Module() {
  try {
    return PopoutV2Module !== undefined;
  } catch (e) {
    return false;
  }
}

function isPoppedOut(app) {
  if (hasPopoutV2Module())
    return PopoutV2Module.singleton.poppedOut.has(app.appId);
  else {
    return false;
  }
}

export default class AtoriaActorSheetV2 extends HandlebarsApplicationMixin(
  ActorSheetV2,
) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
    this.isEditingMode = false;
  }

  static PARTS = {};

  expanded_section = [];

  static DEFAULT_OPTIONS = {
    classes: ["atoria", "actor"],
    position: {
      left: 250,
    },
    window: {
      resizable: true,
      controls: [
        ...ActorSheetV2.DEFAULT_OPTIONS.window.controls,
        {
          action: "onPopoutV2",
          icon: "fas fa-external-link-alt",
          label: "POPOUT.PopOut",
          ownership: "LIMITED",
        },
      ],
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      toggleEditingMode: this._toggleEditingMode,
      onEditImage: this._onEditImage,
      onPopoutV2: this._onPopoutV2,
      onPopinV2: this._onPopinV2,
      createItem: this._createItem,
      editItem: this._editItem,
      deleteItem: this._deleteItem,
      rollable: this._rollSkill,
      expandSection: {
        handler: this._expandSection,
        buttons: [0, 2],
      },
      rollableExpand: {
        handler: this._rollableExpand,
        buttons: [0, 2],
      },
      toggleSkillVisibility: this._toggleSkillVisibility,
      toggleAttribute: this._toggleAttribute,
      toggleEffect: this._toggleEffect,
    },
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
  };

  get title() {
    const is_token = this.document?.isToken ?? false;
    const token_string = is_token ? "[Token] " : "";
    return `${token_string}${game.i18n.localize(this.document.name)}`;
  }

  static async _onPopoutV2(event, _target) {
    if (!hasPopoutV2Module()) return;
    if (isPoppedOut(this)) {
      event.stopPropagation();
      await this.close();
      this.render(true);
    } else {
      await this.render();
      PopoutV2Module.popoutv2App(this);
    }
  }

  /** @override */
  _getHeaderControls() {
    const controls = this.options.window.controls;

    // Portrait image
    const img = this.actor.img;
    controls.find((c) => c.action === "showPortraitArtwork").visible =
      img !== CONST.DEFAULT_TOKEN;

    // Token image
    const pt = this.actor.prototypeToken;
    const tex = pt.texture.src;
    const show_token_art = !(
      pt.randomImg || [null, undefined, CONST.DEFAULT_TOKEN].includes(tex)
    );
    controls.find((c) => c.action === "showTokenArtwork").visible =
      show_token_art;

    // PopOutV2
    controls.find(
      (c) => c.action === "onPopoutV2" && c.label === "POPOUT.PopOut",
    ).visible = hasPopoutV2Module();

    return controls;
  }

  async close(options = {}) {
    this.is_popouted = false;
    return super.close(options);
  }

  async _prepareContext(options) {
    const context = {
      isEditingMode: this.isEditingMode,

      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      gm: game.user.isGM,

      token: this.document.token,

      actor: this.actor,
      system: this.actor.system,
      systemSource: this.actor.system._source,
      flags: this.actor.flags,

      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,

      ruleset: utils.ruleset,

      inputs: foundry.applications.fields,
    };

    if (this.classList) {
      if (this.isEditingMode) this.classList.add("editing-mode");
      else this.classList.remove("editing-mode");
    }

    return context;
  }

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "body":
        context.items = await Promise.all(
          this.actor.items.map(async (i) => {
            // i.descriptive_tooltip = await i.getTooltipHTML();
            i.systemFields = i.system.schema.fields;
            return i;
          }),
        );
        context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        context.effects = await Promise.all(
          this.actor.effects.map(async (i) => {
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
        break;
    }
    return context;
  }

  static async _toggleEditingMode(_event, _target) {
    this.isEditingMode = !this.isEditingMode;
    this.render();
  }

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

  static async _createItem(_event, target) {
    const item_data = {};
    for (const [key, value] of Object.entries(target.dataset)) {
      // Ignore sheet-action related keys
      if (["action", "open"].includes(key)) continue;
      foundry.utils.setProperty(item_data, key, value);
    }
    const item = await this.document?.createSubItem(item_data);
    if (target.dataset.open && item !== undefined) item.sheet.render(true);
  }

  static async _editItem(event, target) {
    const { itemId, effectId } = target.dataset;
    if (itemId !== undefined) await this.document?.editSubItem(itemId);
    if (effectId !== undefined) await this.document?.editEffect(effectId);
  }

  static async _deleteItem(_event, target) {
    const { itemId, effectId } = target.dataset;
    if (itemId !== undefined) await this.document?.deleteSubItem(itemId);
    if (effectId !== undefined) await this.document?.deleteEffect(effectId);
  }

  static async _rollSkill(_event, skill_title) {
    const { skillPath, itemId } = skill_title.dataset;
    if (skillPath !== undefined) await this.actor.rollSkill(skillPath);
    else if (itemId !== undefined)
      await this.actor.items.get(itemId).rollAction();
  }

  static async _expandSection(event, _expand_control) {
    // if (event.button != 2) return;
    const ref_expand_control = event.target.closest("[data-expand-id]");
    const $expand_control = $(ref_expand_control);
    const { expandId } = ref_expand_control.dataset;

    if (!expandId) {
      console.warn("Undefined data-expand-id");
      return;
    }
    if ($expand_control.hasClass("expanded"))
      this.expanded_section.splice(this.expanded_section.indexOf(expandId), 1);
    else this.expanded_section.push(expandId);
    $expand_control.toggleClass("expanded");
  }

  static async _rollableExpand(event, target) {
    switch (event.button) {
      case 0:
        const { skillPath, itemId } = target.dataset;
        if (skillPath !== undefined) await this.actor.rollSkill(skillPath);
        else if (itemId !== undefined)
          await this.actor.items.get(itemId).rollAction();
        break;
      case 2:
        const { expandId } = target.dataset;

        if (!expandId) {
          console.warn("Undefined data-expand-id");
          return;
        }
        const $expand_control = $(target);
        if ($expand_control.hasClass("expanded"))
          this.expanded_section.splice(
            this.expanded_section.indexOf(expandId),
            1,
          );
        else this.expanded_section.push(expandId);
        $expand_control.toggleClass("expanded");
        break;
    }
  }

  static async _toggleSkillVisibility(_event, target) {
    if (!this.isEditable) return;
    const { skillPath } = target.dataset;
    if (!skillPath) return;

    const hidden_skills =
      this.document.getFlag("atoria", "hidden_skills") ?? [];
    if (hidden_skills.includes(skillPath))
      hidden_skills.splice(hidden_skills.indexOf(skillPath), 1);
    else hidden_skills.push(skillPath);
    this.document.setFlag("atoria", "hidden_skills", hidden_skills);
  }

  static async _toggleAttribute(_event, target) {
    const { name } = target.dataset;
    await this.actor.update({
      [`${name}`]: !foundry.utils.getProperty(this.actor, name),
    });
  }

  static async _toggleEffect(_event, target) {
    const { effectId } = target.dataset;
    const effect = this.actor.effects.get(effectId);
    if (!effect) {
      console.warn("Undefined effect-id");
      return;
    }
    await effect.update({
      disabled: !effect.disabled,
    });
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

    html.on("change", ".item-update", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if ((event.target.dataset.name ?? "") === "") return;

      const itemId = event.target.closest("[data-item-id]")?.dataset.itemId;
      if (!itemId) return;

      event.stopImmediatePropagation();
      const item = await this.actor.items.get(itemId);
      if (!item) return;

      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      item.update({ [event.target.dataset.name]: value });
    });

    this.#disableAttributesChangedByActiveEffect();
  }

  #disableAttributesChangedByActiveEffect() {
    for (const attribute_path of Object.keys(
      foundry.utils.flattenObject(this.actor.overrides),
    )) {
      const element = this.element.querySelector(`[name="${attribute_path}"]`);
      if (element) {
        element.disabled = true;
        element.dataset.tooltip = game.i18n.format(
          "ATORIA.Sheet.Disabled_by_active_effect",
          { tooltip: game.i18n.localize(element.dataset.tooltip) },
        );
      }
    }
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
    const el = event.currentTarget;
    if ("link" in event.target.dataset) return;

    let dragData = undefined;

    if (el.dataset.itemId !== undefined) {
      let item = this.actor.items.get(el.dataset.itemId);
      dragData = item?.toDragData();
    }

    if (el.dataset.effectId !== undefined) {
      let effect = this.actor.effects.get(el.dataset.effectId);
      dragData = effect?.toDragData();
    }

    if (!dragData) return;

    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  _onDragOver(event) {}

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    switch (data.type) {
      case "Item":
        return this._onDropItem(event, data);
      case "ActiveEffect":
        return this._onDropEffect(event, data);
    }
  }

  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);

    if (this.actor.uuid === item.parent?.uuid)
      return this._onSortItem(event, item);

    return this._onDropItemCreate(item, event);
  }

  async _onDropEffect(event, data) {
    if (!this.actor.isOwner) return false;
    const effect = await ActiveEffect.implementation.fromDropData(data);

    if (this.actor.uuid === effect.parent?.uuid)
      return this._onSortEffect(event, effect);

    // return this._onDropItemCreate(item, event);
  }

  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  _onSortItem(event, item) {
    const items = this.actor.items;
    const dropTarget = event.target.closest("[data-item-id]");
    if (!dropTarget) return;
    const target = items.get(dropTarget.dataset.itemId);

    if (item.id === target.id) return;

    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== item.id)
        siblings.push(items.get(el.dataset.itemId));
    }

    const sortUpdates = SortingHelpers.performIntegerSort(item, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    return this.actor.updateEmbeddedDocuments("Item", updateData);
  }

  _onSortEffect(event, effect) {
    const effects = this.actor.effects;
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = effects.get(dropTarget.dataset.effectId);

    if (effect.id === target.id) return;

    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      if (siblingId && siblingId !== effect.id)
        siblings.push(effects.get(el.dataset.effectId));
    }

    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    return this.actor.updateEmbeddedDocuments("ActiveEffect", updateData);
  }
}
