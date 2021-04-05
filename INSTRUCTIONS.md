# Creating Content for OWB

You should install the base content module [osb-content](https://raw.githubusercontent.com/chrisesharp/foundryvtt-owb-content/master/src/module.json) for classes, weapons, gear, vehicles and sample NPCs. However you will also want to create your own content, so take note of these instructions when doing so.

## Weapons

The following properties are available for missile weapons:

- Burst fire
- Suppresive fire
- Calibre
- Rate of Fire
- Range
- Save for half damage

To indicate that a weapon is a missile weapon, enable the **bullseye** icon. Otherwise, stick with the **fist** icon to indicate it is a melee weapon.

### Tags

**N.B.** When you are creating a missle weapon, add the following tags:

| Quality | Tag | Required |
| --------|-----|----------|
| Calibre (e.g. 9mm) | "9mm(cal)" | YES|
| Burst fire   | "Burst" | No |
| Suppressive fire| "Suppress" | No|

if you don't provide a Calibre tag, then the missile weapon does not use ammunition i.e. a throwing knife. If you do, you should only provide **ONE** and this will mean the weapon can only be fired if the correct ammo for the weapon is also in a positive quantity in the actors inventory.

### Range

Just add the short range value, and the rest will be automatically calculated.

### Save

Tick this if the weapon gives a target the chance to save for half damage.

## Ammunition

The following properties are available for ammunition items:

- Quantity
- Weight
- Calibre

### Quantity

To indicate this is a magazine or clip of ammo, set the Current/Max values to the size of the clip (e.g. 32 for a typical SMG magazine).

### Calibre

You **MUST** create ammunition items to supply a missile weapon.
When creating an ammunition item, create an *Item*, and add the following tag:

- calibre e.g. `9mm(cal)`
