import { ActorDataModel } from "./actor-data.js";
const fields = foundry.data.fields;

export class EnemyDataModel extends ActorDataModel {
    static defineSchema() {
        const schema = super.defineSchema();

        schema.config = new fields.SchemaField({
            movementAuto: new fields.BooleanField({ initial: true, required: true})
        });

        schema.details = new fields.SchemaField({
            biography: new fields.HTMLField(),
            xp: new fields.NumberField({ initial: 0, integer: true }),
            morale: new fields.NumberField({ initial: 0, integer: true }),
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