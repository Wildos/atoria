export class AtoriaTestParameterDialog extends Application
{

    static get defaultOptions() 
    {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(["atoria", "test-dialog", "form"]);
        options.width = 450;
        options.resizable = true;
        return options;
    }

    #onKeyPress;
    fieldsTemplate = "";
    
    get template() 
    {
        return `systems/atoria/templates/apps/test-dialogs/test-dialog.hbs`;
    }

    get title() 
    {
        return this.data.title;
    }

    get actor() 
    {
        return ChatMessage.getSpeakerActor(this.data.speaker);
    }

    constructor(data={}, fields={}, resolve)
    {
        super();
        this.data = data;
        this.fields = mergeObject(this._defaultFields(),fields);
        this.userEntry = foundry.utils.deepClone(this.fields);

        if (resolve)
        {
            this.resolve = resolve;
        }
    }

    _defaultFields() 
    {
        return {
            modifier : 0,
            SL : 0,
            state : "none",
            rollmode : game.settings.get("core", "rollMode") || "publicroll"
        };
    }

    async getData() 
    {        
        // Reset values so they don't accumulate 
        mergeObject(this.fields, this.userEntry);

        await this.computeFields();

        let state = this.computeState();

        return {
            fields : mergeObject(this.fields, {state})
        };
    }

    updateTargets()
    {
        this.data.targets = Array.from(game.user.targets);
        this.render(true);
    }

    /**
     * Compute whether disadvantage or advantage should be selected
     */
    computeState()
    {
        if (this.forceState) //"adv" "dis" and "none"
        {
            return this.forceState;
        }

        else if (this.advCount > this.disCount)
        {
            return "adv";
        }

        else if (this.disCount > this.advCount)
        {
            return "dis";
        }

        else 
        {
            return "none";
        }
    }

    /**
     * Handle relationships between fields, used by subclasses
     */
    async computeFields() 
    {

    }

    

    /**
     * Allows subclasses to insert custom fields
     */
    async getFieldsTemplate()
    {
        if (this.fieldsTemplate)
        {
            return await renderTemplate(this.fieldsTemplate, await this.getTemplateFields());
        }
    }

    /**
     * Provide data to a dialog's custom field section
     */
    async getTemplateFields() 
    {
        return {fields : this.fields};
    }

    submit(ev) 
    {
        ev.preventDefault();
        ev.stopPropagation();
        let dialogData = mergeObject(this.data, this.fields);
        if (this.resolve)
        {
            this.resolve(dialogData);
        }
        this.close();
        return dialogData;
    }

    close() 
    {
        super.close();
        document.removeEventListener("keypress", this.#onKeyPress);
    }

    activateListeners(html) 
    {
        this.form = html[0];
        this.form.onsubmit = this.submit.bind(this);

        // Listen on all elements with 'name' property
        html.find(Object.keys(new FormDataExtended(this.form).object).map(i => `[name='${i}']`).join(",")).change(this._onInputChanged.bind(this));

        // Need to remember binded function to later remove
        this.#onKeyPress = this._onKeyPress.bind(this);
        document.addEventListener("keypress", this.#onKeyPress);
    }

    _onInputChanged(ev)
    {
        let value = ev.currentTarget.value;
        if (Number.isNumeric(value))
        {
            value = Number(value);
        }

        if (ev.currentTarget.type == "checkbox")
        {
            value = ev.currentTarget.checked;
        }

        this.userEntry[ev.currentTarget.name] = value;

        // If the user clicks advantage or disadvantage, force that state to be true despite calculations
        if (ev.currentTarget.name == "state")
        {
            this.forceState = value;
        }
        this.render(true);
    }

    _onKeyPress(ev)
    {
        if (ev.key == "Enter")
        {
            this.submit(ev); 
        }
    }

    /**
     * 
     * @param {object} data Dialog data, such as title and actor
     * @param {object} data.title.replace Custom dialog/test title
     * @param {object} data.title.append Append something to the test title
     * @param {object} fields Predefine dialog fields
     */
    static awaitSubmit({data={}, fields={}}={})
    {
        return new Promise(resolve => 
        {
            new this(data, fields, resolve).render(true);
        });
    }

    /**
     * 
     * @param {object} actor Actor performing the test
     * @param {object} data Dialog data, such as title and actor
     * @param {object} fields Predefine dialog fields
     */
    static setupData(actor, target, {title={}, fields={}}={})
    {
        log(`${this.prototype.constructor.name} - Setup Dialog Data`, {args : Array.from(arguments).slice(2)});

        let dialogData = {data : {}, fields};
        dialogData.data.speaker = ChatMessage.getSpeaker({actor});
        if (!actor.token)
        {
            // getSpeaker retrieves tokens even if this sheet isn't a token's sheet
            delete dialogData.data.speaker.scene;
        }
        dialogData.data.title = (title?.replace || game.i18n.localize("IMPMAL.Test")) + (title?.append || "");
        if (target)
        {
            dialogData.data.target = target;
        }

        dialogData.data.targets = actor.defendingAgainst ? [] : Array.from(game.user.targets).filter(t => t.document.id != dialogData.data.speaker.token); // Remove self from targets

        log(`${this.prototype.constructor.name} - Dialog Data`, {args : dialogData});
        return dialogData;
    }

    static updateActiveDialogTargets() 
    {
        Object.values(ui.windows).forEach(i => 
        {
            if (i instanceof TestDialog)
            {
                i.updateTargets();
            }
        });
    }
}