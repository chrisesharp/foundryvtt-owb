const fields = foundry.data.fields;

export class ActorDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.hp = new fields.SchemaField({
            value: new fields.NumberField({ initial: 20, integer: true, min: 0, required: true }),
            hd: new fields.StringField({ initial: "1d8", required: true})
        });

        schema.ac = new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true, min: -10, max: 10, required: true }),
            mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
        });

        schema.aac = new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 20, required: true }),
            mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
        });

        schema.thac0 = new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 20, required: true }),
            bhb: new fields.NumberField({ initial: 0, integer: true, required: true }),
            bha: new fields.NumberField({ initial: 0, integer: true, required: true }),
            mod: new fields.SchemaField({ 
                missile: new fields.NumberField({ initial: 0, integer: true, required: true }),
                melee: new fields.NumberField({ initial: 0, integer: true, required: true }),
             }),
        });

        schema.saves = new fields.SchemaField({
            save: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, required: true })
            })
        });

        schema.movement = new fields.SchemaField({
            base: new fields.NumberField({ initial: 120, integer: true, min: 0, required: true })
        });

        schema.initiative = new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true, min: 0, required: true }),
            mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
        });

        schema.scores = new fields.SchemaField({
            str: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            }),
            dex: new fields.SchemaField({
                value: new fields.NumberField({ initial: 0, integer: true, min: 0, max: 18, required: true }),
                mod: new fields.NumberField({ initial: 0, integer: true, required: true }),
            })
        });

        schema.description = new fields.HTMLField();
        return schema;
    }

    static migrateData(source) {
        // Migrate from template.json format to DataModel format        
        return source;
    }
}