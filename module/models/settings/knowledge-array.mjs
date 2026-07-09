const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class KnowledgeArrayField extends HandlebarsApplicationMixin(
  ApplicationV2,
) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "knowledge-array-config",
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
    },
    position: { width: 660 },
    form: {
      closeOnSubmit: false,
      handler: KnowledgeArrayField.#onAdd,
    },
    actions: {
      remove: KnowledgeArrayField.#onRemove,
      reset: KnowledgeArrayField.#onReset,
      save: KnowledgeArrayField.#onSave,
    },
  };

  /** @override */
  static PARTS = {
    data: {
      id: "data",
      template: "systems/atoria/templates/v2/apps/knowledge-array-config.hbs",
      scrollable: [".knowledge-list"],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  #knowledges = undefined;

  get type() {
    return "";
  }

  get title() {
    return (
      game.settings.settings.get("atoria." + this.type)?.name ??
      "<Setting not found>"
    );
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(_options = {}) {
    if (this.#knowledges == undefined) {
      this.#knowledges = foundry.utils.deepClone(
        await game.settings.get("atoria", this.type),
      );
    }
    const current = this.#knowledges;
    return {
      knowledges: current,
      buttons: [
        {
          type: "reset",
          action: "reset",
          icon: "fa-solid fa-arrows-rotate",
          label: "ATORIA.Dialog.Reset",
        },
        {
          type: "save",
          action: "save",
          icon: "fa-solid fa-floppy-disk",
          label: "ATORIA.Dialog.Save",
        },
      ],
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle submission
   * @this {DocumentSheetV2}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async #onAdd(event, form, formData) {
    if (this.#knowledges == undefined) {
      this.#knowledges = [];
    }

    let new_id = formData.object.id;
    let new_label = formData.object.label;

    let already_used_ids = this.#knowledges.map((knl) => knl.id);

    if (already_used_ids.includes(new_id)) {
      this.#knowledges.forEach((knl) => {
        if (knl.id == new_id) {
          knl.label = new_label;
        }
      });
    } else {
      this.#knowledges.push({
        id: new_id,
        label: new_label,
      });
    }

    await this.render();
  }

  /* -------------------------------------------- */

  static async #onReset(event) {
    event.preventDefault();
    await game.settings.set("atoria", this.type, []);
    this.#knowledges = undefined;
    await this.render();
  }

  static async #onRemove(event, target) {
    event.preventDefault();
    if (this.#knowledges == undefined || this.#knowledges.length == 0) {
      console.error("#knowledges is empty or undefined");
      return;
    }
    const { id } = target.dataset;
    this.#knowledges = this.#knowledges.filter((knl) => knl.id != id);
    await this.render();
  }

  static async #onSave(event) {
    event.preventDefault();
    await game.settings.set("atoria", this.type, this.#knowledges);
    this.#knowledges = undefined;
    this.close();
  }

  static getKnowledgeLabelFromId(array, id) {
    return array.find((elem) => elem.id == id)?.label;
  }
}

export class LanguageKnowledgeArrayField extends KnowledgeArrayField {
  get type() {
    return "languages";
  }
}
export class CivilisationKnowledgeArrayField extends KnowledgeArrayField {
  get type() {
    return "civilisations";
  }
}
export class MonstrologyKnowledgeArrayField extends KnowledgeArrayField {
  get type() {
    return "monstrologies";
  }
}
export class ZoologyKnowledgeArrayField extends KnowledgeArrayField {
  get type() {
    return "zoologies";
  }
}
