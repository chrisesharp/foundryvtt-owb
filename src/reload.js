function getAmmo(token) {
    const hasAmmo = (i) => {
        return (i.type == "item" &&  
                (i.data.tags.find(t => t.title.toLowerCase() === "ammunition") !== undefined) &&
                (i.data.tags.find(t => t.title.toLowerCase() === this.name.toLowerCase()) !== undefined));
      }
    return token.actor.data.items.find(f => hasAmmo(f));
}
function reloadAmmo(token, ammo) {
    ammo.data.quantity.value = Math.max(0,ammo.data.quantity.max);
    token.actor.updateEmbeddedEntity("OwnedItem", {...ammo});
}

if (token) {
    const ammo = getAmmo(token);
    const emptyAmmo = (ammo && ammo.data.quantity.value  < ammo.data.quantity.max);
    if (emptyAmmo) {
        reloadAmmo(token, ammo);
        const messageContent = `Reloaded ${ammo.name}`;
        const chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: messageContent
        };
        ChatMessage.create(chatData, {});
    }
}
