export const OWB = {
  scores: {
    str: "OWB.scores.str.long",
    int: "OWB.scores.int.long",
    dex: "OWB.scores.dex.long",
    wis: "OWB.scores.wis.long",
    con: "OWB.scores.con.long",
    cha: "OWB.scores.cha.long",
  },
  roll_type: {
    result: "=",
    above: "≥",
    below: "≤"
  },
  saves_short: {
    true: "OWB.saves.save.short"
  },
  saves_long: {
    save: "OWB.saves.save.long"
  },
  armor : {
    unarmored: "OWB.armor.unarmored",
    light: "OWB.armor.light",
    heavy: "OWB.armor.heavy",
    shield: "OWB.armor.shield",
  },
  colors: {
    green: "OWB.colors.green",
    red: "OWB.colors.red",
    yellow: "OWB.colors.yellow",
    purple: "OWB.colors.purple",
    blue: "OWB.colors.blue",
    orange: "OWB.colors.orange",
    white: "OWB.colors.white"
  },

  languages: [
    {name: "English", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Great_Britain_%281707%E2%80%931800%29.svg/32px-Flag_of_Great_Britain_%281707%E2%80%931800%29.svg.png"},
    {name: "German", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Flag_of_Germany_%281935%E2%80%931945%29.svg/32px-Flag_of_Germany_%281935%E2%80%931945%29.svg.png"},
    {name: "French", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Flag_of_France_%281794%E2%80%931815%2C_1830%E2%80%931958%29.svg/32px-Flag_of_France_%281794%E2%80%931815%2C_1830%E2%80%931958%29.svg.png"},
    {name: "Italian", img:"https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Flag_of_Italy.svg/32px-Flag_of_Italy.svg.png"},
    {name: "Spanish", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Flag_of_Spain_%281938%E2%80%931945%29.svg/32px-Flag_of_Spain_%281938%E2%80%931945%29.svg.png"},
    {name: "Norwegian", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Norway.svg/32px-Flag_of_Norway.svg.png"},
    {name: "Swedish", img:"https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Flag_of_Sweden.svg/32px-Flag_of_Sweden.svg.png"},
    {name: "Finnish", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Finland.svg/32px-Flag_of_Finland.svg.png"},
    {name: "Danish", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Flag_of_Denmark.svg/32px-Flag_of_Denmark.svg.png"},
    {name: "Czech", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_the_Protectorate_of_Bohemia_and_Moravia.svg/32px-Flag_of_the_Protectorate_of_Bohemia_and_Moravia.svg.png"},
    {name: "Magyar", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Flag_of_Hungary_%281915-1918%2C_1919-1946%29.svg/32px-Flag_of_Hungary_%281915-1918%2C_1919-1946%29.svg.png"},
    {name: "Dutch", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/32px-Flag_of_the_Netherlands.svg.png"},
    {name: "Flemish", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Flag_of_Belgium.svg/32px-Flag_of_Belgium.svg.png"},
    {name: "Greek", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Greece_%281822-1978%29.svg/32px-Flag_of_Greece_%281822-1978%29.svg.png"},
    {name: "Polish", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_Poland_%281928%E2%80%931980%29.svg/32px-Flag_of_Poland_%281928%E2%80%931980%29.svg.png"},
    {name: "Russian", img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Flag_of_the_Soviet_Union_%281924%E2%80%931955%29.svg/32px-Flag_of_the_Soviet_Union_%281924%E2%80%931955%29.svg.png"}
  ],
  tags: {
    melee: "OWB.items.Melee",
    missile: "OWB.items.Missile",
    twohanded: "OWB.items.TwoHanded",
    blunt: "OWB.items.Blunt",
    brace: "OWB.items.Brace",
    splash: "OWB.items.Splash",
    reload: "OWB.items.Reload",
    charge: "OWB.items.Charge",
    burst: "OWB.weapons.burst.short",
    suppressive: "OWB.weapons.suppressive.short"
  },
  tag_images: {
    melee: "/systems/owb/assets/default/ability.png",
    missile: "/systems/owb/assets/default/ability.png",
    twohanded: "/systems/owb/assets/default/ability.png",
    blunt: "/systems/owb/assets/default/ability.png",
    brace: "/systems/owb/assets/default/ability.png",
    splash: "/systems/owb/assets/default/ability.png",
    reload: "/systems/owb/assets/default/ability.png",
    charge: "/systems/owb/assets/default/ability.png",
    burst: "/systems/owb/assets/default/burst.png",
    suppressive: "/systems/owb/assets/default/suppress.png"
  },
  enemy_saves: {
    0: {
      label: "Normal Human",
      st: 15
    },
    1: {
      label: "1-3",
      st: 14
    },
    4: {
      label: "4-6",
      st: 13
    },
    7: {
      label: "7-9",
      st: 12
    },
    10: {
      label: "10-12",
      st: 10
    },
    13: {
      label: "13-15",
      st: 8
    },
    16: {
      label: "16-18",
      st: 6
    },
    19: {
      label: "19-21",
      st: 4
    },
    22: {
      label: "22+",
      st: 2
    },
  }
};