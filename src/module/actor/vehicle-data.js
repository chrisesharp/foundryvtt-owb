import { ActorDataModel } from "./actor-data.js";
const fields = foundry.data.fields;

export class VehicleDataModel extends ActorDataModel {
    static defineSchema() {
        const schema = super.defineSchema();
        schema.config = new fields.SchemaField({
            movementAuto: new fields.BooleanField({ initial: false, required: true})
        });

        schema.details = new fields.SchemaField({
            notes: new fields.HTMLField(),
            value: new fields.ArrayField(new fields.ObjectField(), { initial: []})
        });

        schema.attacks = new fields.StringField({ initial: "" });

        schema.encumbrance = new fields.SchemaField({
            max: new fields.NumberField({ initial: 0, max: 250 })
        });

        return schema;
    }

    static migrateData(source) {
        // Call parent migration first
        super.migrateData(source);

        return source;
    }
}