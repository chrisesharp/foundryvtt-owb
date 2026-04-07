const fields = foundry.data.fields;

export class LanguageDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema = {};

        schema.name = new fields.StringField({ initial: "" });
        schema.fluency = new fields.StringField({ initial: "" });
        schema.save = new fields.StringField({ initial: "" });
        
        return schema;
    }

    static migrateData(source) {
        // Base migration for all items
        // No specific migrations needed for base fields
        return source;
    }
}