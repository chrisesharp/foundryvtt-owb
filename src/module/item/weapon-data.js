const fields = foundry.data.fields;

export class WeaponDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.description = new fields.HTMLField();

        schema.range = new fields.SchemaField({
            short: new fields.NumberField({ initial: 0, integer: true}),
            medium: new fields.NumberField({ initial: 0, integer: true}),
            long: new fields.NumberField({ initial: 0, integer: true}),
            extreme: new fields.NumberField({ initial: 0, integer: true}),
        });

        schema.save = new fields.BooleanField({ initial: false });
        schema.missile = new fields.BooleanField({ initial: false });
        schema.melee = new fields.BooleanField({ initial: true });
        schema.equipped = new fields.BooleanField({ initial: false });
        schema.burst = new fields.BooleanField({ initial: false });
        schema.suppressive = new fields.BooleanField({ initial: false });

        schema.pattern = new fields.StringField({ initial: "transparent" });
        schema.damage = new fields.StringField({ initial: "1d6" });
        schema.bonus = new fields.NumberField({ initial: 0, integer: true});
        schema.tags = new fields.ArrayField(new fields.ObjectField(), { initial: []});

        schema.counter = new fields.SchemaField({
            value: new fields.NumberField({ initial: 0, integer: true}),
            max: new fields.NumberField({ initial: 0, integer: true}),
        });
        schema.weight = new fields.NumberField({ initial: 0, integer: true});
        
        return schema;
    }

    static migrateData(source) {
        // Base migration for all items
        // No specific migrations needed for base fields
        return source;
    }
}