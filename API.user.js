// ==UserScript==
// @name         Tank Image
// @description  Tank Image
// @match        https://diep.io/*
// @grant        none
// ==/UserScript==

Tank = {
    0: "Tank", 1: "Twin", 2: "Triplet", 3: "Triple Shot",
    4: "Quad Tank", 5: "Octo Tank", 6: "Sniper", 7: "Machine Gun",
    8: "Flank Guard", 9: "Tri-Angle", 10: "Destroyer", 11: "Overseer",
    12: "Overlord", 13: "Twin Flank", 14: "Penta Shot", 15: "Assassin",
    16: "Arena Closer", 17: "Necromancer", 18: "Triple Twin", 19: "Hunter",
    20: "Gunner", 21: "Stalker", 22: "Ranger", 23: "Booster",
    24: "Fighter", 25: "Hybrid", 26: "Manager", 27: "Mothership",
    28: "Predator", 29: "Sprayer", 31: "Trapper", 32: "Gunner Trapper",
    33: "Overtrapper", 34: "Mega Trapper", 35: "Tri-Trapper", 36: "Smasher",
    38: "Landmine", 39: "Auto Gunner", 40: "Auto 5", 41: "Auto 3",
    42: "Spread Shot", 43: "Streamliner", 44: "Auto Trapper", 45: "Dominator",
    46: "Dominator", 47: "Dominator", 48: "Battleship", 49: "Annihilator",
    50: "Auto Smasher", 51: "Spike", 52: "Factory", 53: "",
    54: "Skimmer", 55: "Rocketeer",  56: "Glider", 57: "Spike",
    58: "Auto Tank", 59: "Overseer Gunner", 60: "Dual-Barrel", 61: "Pellet Shot",
    62: "Shotgun", 63: "Glider", 64: "Firework"
}

function getTankImage(tankName) {
    const URL = 'https://diep.io/old-assets/assets/diep/tanks/tank_';
    let TankID = 0;
    for(const[ID,TankName] of Object.entries(Tank)) {if (TankName===tankName) {TankID=Number(ID); return `${URL}${TankID}.png`;}}
    return `${URL}${TankID}.png`;
}
