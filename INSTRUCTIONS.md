# Creating Content for OWB

## Guns

The following properties are available for missile weapons:

- Burst fire
- Suppresive fire
- Calibre
- Rate of Fire
- Range
- Save for half damage

To indicate that a weapon is a missile weapon, enable the **bullseye** icon.

### Tags

**N.B.** When you are creating a missle weapon, add the following tags:

| Quality | Tag | Required |
| --------|-----|----------|
| Calibre (e.g. 9mm) | "9mm(cal)" | YES|
| Burst fire   | "Burst" | No |
| Suppressive fire| "Suppress" | No|

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

You must create ammunition items to supply a missile weapon.
When creating an ammunition item, create an *Item*, and add the following tag:

- calibre e.g. "9mm(cal)"
