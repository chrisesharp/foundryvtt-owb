const { loadTemplates } = foundry.applications.handlebars;

export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Actor partials
        'systems/owb/templates/actors/partials/actor-notes.hbs',
        'systems/owb/templates/actors/partials/character-attributes.hbs',
        'systems/owb/templates/actors/partials/character-abilities.hbs',
        'systems/owb/templates/actors/partials/character-header.hbs',
        'systems/owb/templates/actors/partials/character-inventory.hbs',
        'systems/owb/templates/actors/partials/character-nav.hbs',

        'systems/owb/templates/actors/partials/enemy-header.html',
        'systems/owb/templates/actors/partials/enemy-attributes-tab.html',

        'systems/owb/templates/actors/partials/vehicle-header.html',
        'systems/owb/templates/actors/partials/vehicle-attributes-tab.html'
    ];
    return loadTemplates(templatePaths);
};
