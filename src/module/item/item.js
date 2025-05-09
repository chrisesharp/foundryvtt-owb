import { OWBDice } from "../dice.js";
const { renderTemplate } = foundry.applications.handlebars;
const { DialogV2 } = foundry.applications.api;
const { TextEditor } = foundry.applications.ux;

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class OWBItem extends Item {
  /* -------------------------------------------- */
  /*	Data Preparation														*/
  /* -------------------------------------------- */
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
    // Set default image
    let img = CONST.DEFAULT_TOKEN;
    switch (this.type) {
      case "ability":
        img = "systems/owb/assets/default/abilities.png";
        break;
      case "armor":
        img = "systems/owb/assets/default/clothing.png";
        break;
      case "weapon":
        img = "systems/owb/assets/default/ability.png";
        break;
      case "item":
        img = "systems/owb/assets/default/backpack.png";
        break;
      case "language":
        img = "systems/owb/assets/default/abilities.png";
        break;
    }
    if (!this.img) this.img = img;
    
  }

  static chatListeners(html) {
    const buttons = html.querySelectorAll('.card-buttons button');
    buttons.forEach((el) => {
      el.addEventListener("click", this._onChatCardAction.bind(this));
    });

    const items = html.querySelectorAll('.item-name')
    items.forEach((el) => {
      el.addEventListener("click", this._onChatCardToggleContent.bind(this));
    });
  }

 async  getChatData(htmlOptions={async: true}) {
    const data = foundry.utils.duplicate(this.system);

    // Rich text description
    data.description = await TextEditor.enrichHTML(data.description, htmlOptions);

    // Item properties
    const props = [];

    if (this.type == "weapon" || this.type == "item") {
      data.tags.forEach(t => props.push(t.value));
    }
    if (data.hasOwnProperty("equipped")) {
      props.push(data.equipped ? "Equipped" : "Not Equipped");
    }

    // Filter properties and return
    data.properties = props.filter((p) => !!p);
    return data;
  }

  rollWeapon(options = {}) {
    const isNPC = this.actor.type != "character";
    const data = this.system;
    let type = isNPC ? "attack" : "melee";
    
    let calibre;
    let ammo;
    if (options.type !== "melee") {
      calibre = data.tags.filter(i => i.title === "cal");
      calibre = calibre.length > 0 ? calibre[0].value : 0;
      const hasAmmo = (i) => {
        return (i.type == "item" &&  i.system.tags &&
                (i.system.tags.find(t => t.title === "cal" && t.value === calibre) !== undefined)
                );
      }
      ammo = this.actor.items.contents.filter(hasAmmo);
      if (calibre) {
        if (ammo.length == 0) {
          ui.notifications.warn(`You have no ammunition for this weapon.`);
          return;
        } else {
          ammo = ammo[0];
          ammo.calibre = calibre;
        }
      }
    }

    const rollData = {
      item: this,
      actor: this.actor,
      roll: {
        save: this.system.save,
        target: null
      }
    };
    if (calibre) {
      rollData.ammo = ammo;
    }

    const button = (type) => {
      let icon = (type === 'melee') ? 'fas fa-fist-raised': 'fas fa-bullseye';
      return {
        icon: icon,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        action: type,
        callback: (html) => {
          rollData['burst'] = html.currentTarget.querySelector("#burst").checked;
          rollData['suppress'] = html.currentTarget.querySelector("#suppress").checked;
          this.actor.targetAttack(rollData, type, options);
        }
      }
    }

    const fire_opt = (type, enabled=false, checked=false) => {
      const _checked = (checked) ? "checked" : "";
      const _disabled = (!enabled) ? "disabled" : "";
      return `<input type='radio' id='${type}' name='fire' value='${type}' ${_checked} ${_disabled}><label for='${type}'>${type}</label>`;
    }

    if (data.missile) {
      let btns = []
      if (data.melee) {
        btns.push(button("melee"));
      }
      btns.push(button("short"));
      btns.push(button("medium"));
      btns.push(button("long"));
      btns.push(button("extreme"));

      let extra_options = "<label>Fire:</label>" + fire_opt("normal",true, true);
      if (data.burst) {
        extra_options += fire_opt("burst",true);
      } else {
        extra_options += fire_opt("burst");
      }

      if (data.suppressive) {
        extra_options += fire_opt("suppress",true);
      } else {
        extra_options += fire_opt("suppress");
      }

      DialogV2.wait({
        classes: ['owb', 'ranged-attack'],
        window: {
          title: 'Choose Attack Range',
        },
        modal: false,
        content: extra_options,
        buttons: btns,
        rejectClose: false,
        submit: () => {
        },
      });
      return true;
    } else if (!data.missile && !isNPC) {
      type = "melee";
    }
    this.actor.targetAttack(rollData, type, options);
    return true;
  }

  async rollFormula(options = {}) {
    const data = this.system;
    if (!data.roll) {
      return;
    }

    const label = `${this.name}`;
    const rollParts = [data.roll];

    let type = data.rollType;

    const newData = {
      actor: this.actor,
      item: this,
      roll: {
        type: type,
        target: data.rollTarget,
        blindroll: data.blindroll,
      },
    };

    // Roll and return
    return OWBDice.Roll({
      event: options.event,
      parts: rollParts,
      data: newData,
      skipDialog: true,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: game.i18n.format("OWB.roll.formula", { label: label }),
      title: game.i18n.format("OWB.roll.formula", { label: label }),
    });
  }

  getTags() {
    let formatTag = (tag, icon) => {
      if (!tag) return "";
      let fa = "";
      if (icon) {
        fa = `<i class="fas ${icon}"></i> `;
      }
      return `<li class='tag'>${fa}${tag}</li>`;
    };

    const data = this.system;
    switch (this.type) {
      case "weapon":
        let wTags = formatTag(data.damage, "fa-bolt");
        wTags += formatTag(data.counter.max, "fa-times");
        data.tags.forEach((t) => {
          wTags += formatTag(t.value);
        });
        if (data.missile) {
          wTags += formatTag(`${data.range.short}/${data.range.medium}/${data.range.long}/${data.range.extreme}`, "fa-bullseye");
          wTags += formatTag(CONFIG.OWB.saves_short[data.save], "fa-skull");
        }
        return wTags;
      case "armor":
        return `${formatTag(CONFIG.OWB.armor[data.type], "fa-tshirt")}`;
      case "item":
        let iTags = "";
        data.tags.forEach((t) => {
          iTags += formatTag(t.value);
        });
        return iTags;
      case "ability":
        let roll = "";
        roll += data.roll ? data.roll : "";
        roll += data.rollTarget ? CONFIG.OWB.roll_type[data.rollType] : "";
        roll += data.rollTarget ? data.rollTarget : "";
        const reqs = data.requirements.split(",");
        let reqTags = "";
        reqs.forEach((r) => reqTags += formatTag(r))
        return `${reqTags}${formatTag(roll)}`;
      case "language":
        return data.fluency;
    }
    return "";
  }

  pushTag(values) {
    const data = this.system;
    let update = (data.tags) ? foundry.utils.duplicate(data.tags) : [];
    let newData = {};
    var regExp = /\(([^)]+)\)/;
    values.forEach((val) => {
      // Catch infos in brackets
      var matches = regExp.exec(val);
      let title = "";
      if (matches) {
        title = matches[1];
        val = val.substring(0, matches.index).trim();
      } else {
        val = val.trim();
        title = val;
      }
      // Auto fill checkboxes
      switch (val) {
        case CONFIG.OWB.tags.melee:
          newData.melee = true;
          break;
        case CONFIG.OWB.tags.missile:
          newData.missile = true;
          break;
        case CONFIG.OWB.tags.burst:
          newData.burst = true;
          break;
        case CONFIG.OWB.tags.suppressive:
          newData.suppressive = true;
          break;
      }
      update.push({ title: title, value: val });
    });
    newData.tags = update;
    return this.update({ system: newData });
  }

  popTag(value) {
    const data = this.system;
    let update = data.tags.filter((el) => el.value != value);
    let newData = {
      tags: update,
    };
    return this.update({ system: newData });
  }

  roll() {
    switch (this.type) {
      case "weapon":
        this.rollWeapon();
        break;
      case "ability":
        if (this.system.roll) {
          this.rollFormula();
        } else {
          this.show();
        }
        break;
      case "language":
        this.rollFormula();
        break;
      case "item":
      case "armor":
        this.show();
    }
  }

  /**
   * Show the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
  async show() {
    // Basic template rendering data
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token ? `${token.uuid}` : null,
      item: foundry.utils.duplicate(this),
      data: await this.getChatData(),
      labels: this.labels,
      isHealing: this.isHealing,
      hasDamage: this.hasDamage,
      hasSave: this.hasSave,
      config: CONFIG.OWB,
    };

    // Render the chat card template
    const template = `systems/owb/templates/chat/item-card.html`;
    const html = await renderTemplate(template, templateData);

    // Basic chat message data
    const chatData = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_STYLES.OTHER,
      content: html,
      speaker: {
        actor: this.actor.id,
        token: this.actor.token,
        alias: this.actor.name,
      },
    };

    // Toggle default roll mode
    const rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    // Create the chat message
    return ChatMessage.create(chatData);
  }

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    if (content.style.display === "none") {
      $(content).slideDown(200);
    } else {
      $(content).slideUp(200);
    }
  }

  static async _onChatCardAction(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;

    // Validate permission to proceed with the roll
    const isTargetted = (action === "save");
    if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

    // Get the Actor from a synthetic Token
    const actor = await this._getChatCardActor(card);
    if (!actor) return;

    // Get the Item
    const item = actor.items.get(card.dataset.itemId);
    if (!item) {
      return ui.notifications.error(
        `The requested item ${card.dataset.itemId} no longer exists on Actor ${actor.name}`
      );
    }

    // Get card targets
    let targets = [];
    if (isTargetted) {
      targets = this._getChatCardTargets(card);
    }

    // Attack and Damage Rolls
    if (action === "damage") await item.rollDamage({ event });
    else if (action === "formula") await item.rollFormula({ event });
    // Saving Throws for card targets
    else if (action == "save") {
      if (!targets.length) {
        ui.notifications.warn(
          `You must have one or more controlled Tokens in order to use this option.`
        );
        return (button.disabled = false);
      }
      for (let t of targets) {
        await t.rollSave(button.dataset.action, { event });
      }
    }

    // Re-enable the button
    button.disabled = false;
  }

  static async _getChatCardActor(card) {
    // Case 1 - a synthetic actor from a Token
    const tokenKey = card.dataset.tokenId;
    if (tokenKey) {
      const token = await fromUuid(tokenKey);
      // const [sceneId, tokenId] = tokenKey.split(".");
      // const scene = game.scenes.get(sceneId);
      // if (!scene) return null;
      // const tokenData = scene.getEmbeddedDocument("Token", tokenId);
      // if (!tokenData) return null;
      // const token = new Token(tokenData);
      return token?.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

  static _getChatCardTargets(card) {
    const character = game.user.character;
    const controlled = canvas.tokens.controlled;
    const targets = controlled.reduce(
      (arr, t) => (t.actor ? arr.concat([t.actor]) : arr),
      []
    );
    if (character && controlled.length === 0) targets.push(character);
    return targets;
  }
}
