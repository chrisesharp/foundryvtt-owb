import { OWBActor } from "./entity.js";
import { OWBActorSheet } from "./actor-sheet.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class OWBActorSheetVehicle extends OWBActorSheet {
  constructor(...args) {
    super(...args);
  }
  
  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["owb", "sheet", "vehicle", "actor"],
      template: "systems/owb/templates/actors/vehicle-sheet.html",
      width: 450,
      height: 560,
      resizable: true,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
    });
  }

  /**
   * Prepare data for rendering the Actor sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData() {
    const data = super.getData();

    // Settings
    // data.config.morale = game.settings.get("owb", "morale");
    data.isNew = this.actor.isNew();
    return data;
  }


  async _onDrop(event) {
    super._onDrop(event);
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (data.type !== "RollTable") return;
    } catch (err) {
      return false;
    }

    let link = "";
    if (data.pack) {
      let tableData = game.packs.get(data.pack).index.filter(el => el._id === data.id);
      link = `@Compendium[${data.pack}.${data.id}]{${tableData[0].name}}`;
    } else {
      link = `@RollTable[${data.id}]`;
    }
  }

  async _chooseItemType(choices = ["weapon", "armor", "shield", "gear"]) {
    let templateData = { types: choices },
      dlg = await renderTemplate(
        "systems/owb/templates/items/entity-create.html",
        templateData
      );
    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("OWB.dialog.createItem"),
        content: dlg,
        buttons: {
          ok: {
            label: game.i18n.localize("OWB.Ok"),
            icon: '<i class="fas fa-check"></i>',
            callback: (html) => {
              resolve({
                type: html.find('select[name="type"]').val(),
                name: html.find('input[name="name"]').val(),
              });
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("OWB.Cancel"),
          },
        },
        default: "ok",
      }).render(true);
    });
  }

  async _resetCounters(event) {
    const weapons = this.actor.data.items.filter(i => i.type === 'weapon');
    for (let wp of weapons) {
      const item = this.actor.items.get(wp.id);
      await item.update({
        data: {
          counter: {
            value: parseInt(wp.data.counter.max),
          },
        },
      });
    }
  }

  async _onCountChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (event.target.dataset.field == "value") {
      return item.update({
        "data.counter.value": parseInt(event.target.value),
      });
    } else if (event.target.dataset.field == "max") {
      return item.update({
        "data.counter.max": parseInt(event.target.value),
      });
    }
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteEmbeddedDocuments([li.data("itemId")]);
      li.slideUp(200, () => this.render(false));
    });

    html.find(".item-create").click((event) => {
      event.preventDefault();
      const header = event.currentTarget;
      const type = header.dataset.type;

      // item creation helper func
      let createItem = function (type, name = `New ${type.capitalize()}`) {
        const itemData = {
          name: name ? name : `New ${type.capitalize()}`,
          type: type,
          data: duplicate(header.dataset),
        };
        delete itemData.data["type"];
        return itemData;
      };

      // Getting back to main logic
      if (type == "choice") {
        const choices = header.dataset.choices.split(",");
        this._chooseItemType(choices).then((dialogInput) => {
          const itemData = createItem(dialogInput.type, dialogInput.name);
          this.actor.createEmbeddedDocument("Item",itemData, {});
        });
        return;
      }
      const itemData = createItem(type);
      return this.actor.createEmbeddedDocument("Item",itemData, {});
    });

    html.find(".item-reset").click((ev) => {
      this._resetCounters(ev);
    });

    html
      .find(".counter input")
      .click((ev) => ev.target.select())
      .change(this._onCountChange.bind(this));

    html.find(".hp-roll").click((ev) => {
      let actorObject = this.actor;
      actorObject.rollHP({ event: event });
    });

    html.find(".item-pattern").click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      let currentColor = item.data.data.pattern;
      let colors = Object.keys(CONFIG.OWB.colors);
      let index = colors.indexOf(currentColor);
      if (index + 1 == colors.length) {
        index = 0;
      } else {
        index++;
      }
      item.update({
        "data.pattern": colors[index]
      })
    });
  }
}
