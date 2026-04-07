const fields = foundry.data.fields;

export class ItemDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.description = new fields.HTMLField();
        schema.quantity = new fields.SchemaField({
            value: new fields.NumberField({ initial: 1, integer: true}),
            max: new fields.NumberField({ initial: 0, integer: true}),
        });
        schema.tags = new fields.ArrayField(new fields.ObjectField(), { initial: []});
        schema.treasure = new fields.BooleanField({ initial: false });
        schema.weight = new fields.NumberField({ initial: 0, integer: true});
        
        return schema;
    }

    static migrateData(source) {
        // Base migration for all items
        // No specific migrations needed for base fields
        return source;
    }
}