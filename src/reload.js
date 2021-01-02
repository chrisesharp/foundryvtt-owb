function getAmmo(token) {
    return token.actor.data.items.find(f => f.name.includes("Ammunition") && f.type === "item");
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
        var messageContent = `Reloaded ${ammo.name}`;
        var chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: messageContent};
        ChatMessage.create(chatData, {});
    }
}
