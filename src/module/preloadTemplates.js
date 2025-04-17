const { loadTemplates } = foundry.applications.handlebars;

export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        'systems/owb/templates/actors/partials/actor-notes.hbs',
        'systems/owb/templates/actors/partials/actor-nav.hbs',
        
        'systems/owb/templates/actors/partials/character-attributes.hbs',
        'systems/owb/templates/actors/partials/character-abilities.hbs',
        'systems/owb/templates/actors/partials/character-header.hbs',
        'systems/owb/templates/actors/partials/character-inventory.hbs',
        'systems/owb/templates/actors/partials/character-nav.hbs',

        'systems/owb/templates/actors/partials/enemy-header.hbs',
        'systems/owb/templates/actors/partials/enemy-attributes.hbs',

        'systems/owb/templates/actors/partials/vehicle-header.hbs',
        'systems/owb/templates/actors/partials/vehicle-attributes.hbs',
        'systems/owb/templates/actors/partials/vehicle-notes.hbs',

        'systems/owb/templates/items/partials/item-header.hbs',
        'systems/owb/templates/items/partials/item-body.hbs',
        'systems/owb/templates/items/partials/ability-body.hbs',
        'systems/owb/templates/items/partials/weapon-body.hbs',
    ];
    return loadTemplates(templatePaths);
};
