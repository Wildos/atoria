const { DataField, ObjectField } = foundry.data.fields;
const { DataModelValidationFailure } = foundry.data.validation;


export default class TypedDictionaryField extends ObjectField {

    constructor(sub_element, options = {}) {
        super(options);
        this.sub_element = this.constructor._validateElementType(sub_element);
    }

    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, {
            required: true,
            nullable: false,
        });
    }

    static _validateElementType(sub_element) {
        if (!(sub_element instanceof DataField)) {
            throw new Error(`${this.name} must have a DataField as its contained sub_element`);
        }
        return sub_element;
    }

    // apply(fn, data = {}, options = {}) {
    //     const results = {};
    //     for (const [key, value] of Object.entries(data)) {
    //         const r = this.sub_element.apply(fn, value, options);
    //         if (!options.filter) results[key] = r;
    //     }
    //     return results;
    // }

    clean(value, options = {}) {

        // Permit explicitly null values for nullable fields
        if (value === null) {
            if (this.nullable) return value;
            value = undefined;
        }

        // Get an initial value for the field
        if (value === undefined) {
            return this.getInitialValue(options.source);
        }

        // Cast a provided value to the correct type
        value = this._cast(value);

        // Cleaning logic specific to the DataField.
        return this._cleanType(value, options);
    }

    _cast(value) {
        // return foundry.utils.getType(value) === "Object" ? value : {};
        const result = {};
        for (const [name, subvalue] of Object.entries(value)) {
            result[name] = this.sub_element._cast(subvalue);
        }
        return result;
    }

    _cleanType(data, options = {}) {
        for (const [name, value] of Object.entries(data)) {
            data[name] = this.sub_element.clean(value, options);
        }
        return data;
    }


    _validateType(data, options = {}) {
        if (foundry.utils.getType(data) !== "Object") throw new Error("must be an object");
        options.source = options.source || data;
        const schemaFailure = new DataModelValidationFailure();
        for (const [key, value] of Object.entries(data)) {
            const failure = this.sub_element._validateType(value, options);

            if (failure) {
                schemaFailure.elements.push({ id: key, failure });
                schemaFailure.unresolved ||= failure.unresolved;
            }
        }
        if (schemaFailure.elements.length) return schemaFailure;
    }

    // _validateModel(changes, options = {}) {
    //     for (const [_, change] of Object.entries(changes)) {
    //         this.sub_element._validateModel(change, options);
    //     }
    // }

    // Not required
    // initialize(value, model, options = {}) {
    //     return this.sub_element.initialize(value, model, options);
    //     // const new_value = super.initialize(value, model, options);
    //     // if (!new_value) return new_value;
    //     // for (let [name, _] of Object.entries(new_value)) {
    //     //     new_value[name] = this.sub_element.initialize(new_value[name], model, options);
    //     // }
    //     // return new_value;
    // }

    _getField(path) {
        if (!path.length) return this;
        if (path[0] === "sub_element") path.shift();
        return this.sub_element._getField(path);
    }

}