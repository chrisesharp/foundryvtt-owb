export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Character Sheets
        'systems/owb/templates/actors/character-sheet.html',
        'systems/owb/templates/actors/enemy-sheet.html',
        'systems/owb/templates/actors/vehicle-sheet.html',
        //Actor partials
        //Sheet tabs
        'systems/owb/templates/actors/partials/character-header.html',
        'systems/owb/templates/actors/partials/character-attributes-tab.html',
        'systems/owb/templates/actors/partials/character-abilities-tab.html',
        'systems/owb/templates/actors/partials/character-inventory-tab.html',
        'systems/owb/templates/actors/partials/character-notes-tab.html',

        'systems/owb/templates/actors/partials/enemy-header.html',
        'systems/owb/templates/actors/partials/enemy-attributes-tab.html',

        'systems/owb/templates/actors/partials/vehicle-header.html',
        'systems/owb/templates/actors/partials/vehicle-attributes-tab.html'
    ];
    return loadTemplates(templatePaths);
};
