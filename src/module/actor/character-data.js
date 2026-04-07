import { ActorDataModel } from "./actor-data.js";
const fields = foundry.data.fields;

export class CharacterDataModel extends ActorDataModel {
    static defineSchema() {
        const schema = super.defineSchema();

        schema.config = new fields.SchemaField({
            movementAuto: new fields.BooleanField({ initial: true, required: true})
        });

        schema.details = new fields.SchemaField({
            biography: new fields.HTMLField(),
            notes: new fields.HTMLField(),
            class: new fields.StringField({ initial: "", required: true }),
            nationality: new fields.StringField({ initial: "", required: true }),
            profession: new fields.StringField({ initial: "", required: true }),
            title: new fields.StringField({ initial: "", required: true }),
            rank: new fields.NumberField({ initial: 1, required: true}),
            xp: new fields.SchemaField({
                share: new fields.NumberField({ initial: 100 }),
                next:  new fields.NumberField({ initial: 2000 }),
                value: new fields.NumberField({ initial: 0 }),
                bonus: new fields.NumberField({ initial: 0 }),
            })
        });

        schema.scores = new fields.SchemaField({
            str: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            }),
            int: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            }),
            wis: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            }),
            dex: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            }),
            con: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            }),
            cha: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            })
        });

        schema.encumbrance = new fields.SchemaField({
            max: new fields.NumberField({ initial: 0, max: 250 })
        });

        schema.languages = new fields.SchemaField({
            value: new fields.ArrayField(new fields.ObjectField(), { initial: []})
        });

        return schema;
    }

    static migrateData(source) {
        // Call parent migration first
        super.migrateData(source);

        return source;
    }
}