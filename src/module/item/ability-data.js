const fields = foundry.data.fields;

export class AbilityDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.description = new fields.HTMLField();
        schema.pattern = new fields.StringField({ initial: "white" });
        schema.requirements = new fields.StringField({ initial: "" });
        schema.roll = new fields.StringField({ initial: "" });
        schema.rollType = new fields.StringField({ initial: "result" });
        schema.rollTarget = new fields.NumberField({ initial: 0, integer: true});
        schema.blindroll = new fields.BooleanField({ initial: false });
        schema.save = new fields.StringField({ initial: "" });
        
        return schema;
    }

    static migrateData(source) {
        // Base migration for all items
        // No specific migrations needed for base fields
        return source;
    }
}