import { world, system, Player, GameMode } from "@minecraft/server";

const HEAT_THRESHOLD = 48;
const HEAT_DAMAGE_THRESHOLD = 58;
const HEAT_STROKE_THRESHOLD = 65;

const HEAT_ARMOR_ITEMS = {
    "ts:sun_hat": { slot: "slot.armor.head", heat_resistance: 4 },
    "ts:turtle_helmet": { slot: "slot.armor.chest", heat_resistance: 6 },
    "ts:turtle_leggings": { slot: "slot.armor.legs", heat_resistance: 4 },
    "ts:turtle_boots": { slot: "slot.armor.feet", heat_resistance: 3 },
    "ac:desert_hood": { slot: "slot.armor.head", heat_resistance: 3 },
    "ac:desert_robe": { slot: "slot.armor.chest", heat_resistance: 5 },
    "ac:desert_leggings": { slot: "slot.armor.legs", heat_resistance: 3 },
    "ac:desert_boots": { slot: "slot.armor.feet", heat_resistance: 2 }
};

const COOLING_ITEMS = [
    "ts:cactus_juice",
    "ac:cool_drink",
    "minecraft:ice",
    "minecraft:snowball"
];

let player_waterskin = {};
let player_heat_immune = {};
let player_soaked_level = {};

export function getPlayerScoakedLevel(player) {
    return player_soaked_level[player.id] || 0;
}

export function getScoHeatResistance(player) {
    let resistance = 0;
    try {
        let equip = player.getComponent("minecraft:equippable");
        if (!equip) return 0;
        for (let [itemId, data] of Object.entries(HEAT_ARMOR_ITEMS)) {
            let item = equip.getEquipment(data.slot);
            if (item && item.typeId === itemId) {
                resistance += data.heat_resistance;
            }
        }
    } catch(e) {}
    return resistance;
}

function applyHeatEffects(player, temp, heatResistance) {
    const effectiveHeat = temp - heatResistance;
    if (effectiveHeat > HEAT_STROKE_THRESHOLD) {
        try {
            player.addEffect("nausea", 100, { amplifier: 0, showParticles: true });
            player.addEffect("weakness", 100, { amplifier: 0, showParticles: true });
            if (system.currentTick % 40 === 0) {
                player.applyDamage(1, { cause: "temperature" });
            }
        } catch(e) {}
    } else if (effectiveHeat > HEAT_DAMAGE_THRESHOLD) {
        try {
            player.addEffect("weakness", 60, { amplifier: 0, showParticles: false });
        } catch(e) {}
    }
}

function applySandstormEffects(player, biomeTemp) {
    if (biomeTemp > 1.5) {
        try {
            player.addEffect("slowness", 40, { amplifier: 0, showParticles: false });
        } catch(e) {}
    }
}

system.runInterval(() => {
    for (let player of world.getPlayers()) {
        if (player.getGameMode() === GameMode.creative || player.getGameMode() === GameMode.spectator) continue;

        let id = player.id;
        if (player_soaked_level[id] === undefined) player_soaked_level[id] = 0;
        if (player_waterskin[id] === undefined) player_waterskin[id] = 0;

        try {
            let isTouchingWater = player.isInWater;
            let isRaining = player.dimension.id === "minecraft:overworld" && world.isRaining;

            if (isTouchingWater) {
                player_soaked_level[id] = Math.min(1.0, player_soaked_level[id] + 0.02);
            } else if (isRaining) {
                player_soaked_level[id] = Math.min(1.0, player_soaked_level[id] + 0.005);
            } else {
                player_soaked_level[id] = Math.max(0, player_soaked_level[id] - 0.003);
            }

            player.setDynamicProperty("ts_soaked_level", player_soaked_level[id]);
        } catch(e) {}
    }
}, 10);

world.afterEvents.itemUseOn.subscribe(e => {
    if (e.itemStack.typeId === "ts:cactus_juice") {
        let player = e.source;
        if (!(player instanceof Player)) return;
        try {
            let temp = player.getDynamicProperty("ts_body_temp") || 36;
            if (temp > 30) {
                let newTemp = Math.max(36, temp - 8);
                player.setDynamicProperty("ts_body_temp", newTemp);
            }
        } catch(e2) {}
    }
});

world.afterEvents.entityHurt.subscribe(e => {
    if (e.hurtEntity instanceof Player && e.damageSource?.cause === "fire") {
        let player = e.hurtEntity;
        let id = player.id;
        player_soaked_level[id] = Math.max(0, (player_soaked_level[id] || 0) - 0.3);
    }
});

export function applyScorchfulEffects(player, bodyTemp) {
    let heatResistance = getScoHeatResistance(player);
    applyHeatEffects(player, bodyTemp, heatResistance);
    try {
        let biome = player.dimension.id;
        if (biome === "minecraft:overworld") {
            let loc = player.location;
            if (loc.y < 62) return;
            applySandstormEffects(player, 1.0);
        }
    } catch(e) {}
}
