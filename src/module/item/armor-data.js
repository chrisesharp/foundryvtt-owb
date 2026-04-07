const fields = foundry.data.fields;

export class ArmorDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.description = new fields.HTMLField();

        schema.ac = new fields.SchemaField({
            value: new fields.NumberField({ initial: 9 })
        });
        schema.aac = new fields.SchemaField({
            value: new fields.NumberField({ initial: 10 })
        });
        schema.type = new fields.StringField({ initial: "light" });
        schema.equipped = new fields.BooleanField({ initial: false });
        schema.weight = new fields.NumberField({ initial: 0, integer: true});
        
        return schema;
    }

    static migrateData(source) {
        // Base migration for all items
        // No specific migrations needed for base fields
        source = super.migrateData(source);

        if (source.ac === undefined) source.ac = 9;
        if (source.aac === undefined) source.aac = 10;
        if (source.type === undefined) source.type = "light";
        if (source.equipped === undefined) source.equipped = false;
        if (source.weight === undefined) source.weight = 0;
        return source;
    }
}