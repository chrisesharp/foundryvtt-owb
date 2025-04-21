const { DialogV2 } = foundry.applications.api;
function getAmmo(token, calibre) {
    if (token && calibre) {
      const hasAmmo = (i) => {
        return (i.type == "item" &&  i.system.tags &&
                (i.system.tags.find(t => t.title === "cal" && t.value === calibre) !== undefined)
                );
      }
      return token.actor.items.find(f => hasAmmo(f));
    }
    return [];
}

async function reloadAmmo(token, weapon_id) {
    const weapon = token.actor.items.find(f => f.id === weapon_id);
    let calibre = weapon.system.tags.filter(i => i.title === "cal");
    calibre = calibre.length > 0 ? calibre[0].value : 0;
    const ammo = getAmmo(token, calibre);
    let messageContent;
    if (ammo) {
        const qty = Math.max(0,ammo.system.quantity.max);
        await ammo.update({system:{quantity:{value:qty}}});
        messageContent = `Reloaded ${weapon.name} with ${ammo.name}`;
    } else {
        messageContent = `You don't have any ammo for a ${weapon.name}`;
    }
    const chatData = {
        user: game.user._id,
        speaker: ChatMessage.getSpeaker(),
        content: messageContent
    };
    ChatMessage.create(chatData, {});
}

if (token) {
    let applyChanges = false;
    let options = ""
    token.actor.items.forEach(w => {
    if (w.type === "weapon") {
        options += `<option value="${w.id}">${w.name}</option>\n`;
    }
    });
    DialogV2.wait({
        window: {
            title: `Token Vision Configuration`,
        },
        content: `
            <form>
            <div class="form-group">
                <label>Reload Weapon:</label>
                <select id="weapon" name="weapon">
                <option value="none">No Weapon</option>
                ${options}
                </select>
            </div>
            </form>
            `,
        buttons: [
            {
                action: 'yes',
                icon: 'fas fa-check',
                label: 'OWB.Reload',
                callback: () => applyChanges = true
            },
            {
                action: 'no',
                icon: 'fas fa-times',
                label: 'OWB.Cancel'
            },
        ],
        default: "yes",
        submit: html => {
            if (applyChanges) {
                const weapon_id = html.querySelector('[name="weapon"]').value || "none";
                if (weapon_id !== "none") {
                    reloadAmmo(token, weapon_id);
                }
            }
        }
    });
} else {
    ui.notifications.warn(`You must select a token first.`);
}