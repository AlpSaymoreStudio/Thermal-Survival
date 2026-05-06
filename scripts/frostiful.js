import { world, system, Player, GameMode } from "@minecraft/server";

const COLD_THRESHOLD = 14;
const FREEZE_THRESHOLD = 5;
const SHIVER_THRESHOLD = 20;

const COLD_ARMOR_ITEMS = {
    "ts:fur_helmet": { slot: "slot.armor.head", cold_resistance: 3 },
    "ts:fur_chestplate": { slot: "slot.armor.chest", cold_resistance: 5 },
    "ts:fur_leggings": { slot: "slot.armor.legs", cold_resistance: 4 },
    "ts:fur_boots": { slot: "slot.armor.feet", cold_resistance: 2 },
    "ts:fur_padded_chainmail_helmet": { slot: "slot.armor.head", cold_resistance: 5 },
    "ts:fur_padded_chainmail_chestplate": { slot: "slot.armor.chest", cold_resistance: 7 },
    "ts:fur_padded_chainmail_leggings": { slot: "slot.armor.legs", cold_resistance: 6 },
    "ts:fur_padded_chainmail_boots": { slot: "slot.armor.feet", cold_resistance: 4 },
    "ts:frostology_cloak": { slot: "slot.armor.chest", cold_resistance: 99 },
    "ac:winter_hood": { slot: "slot.armor.head", cold_resistance: 3 },
    "ac:winter_coat": { slot: "slot.armor.chest", cold_resistance: 5 },
    "ac:winter_leggings": { slot: "slot.armor.legs", cold_resistance: 4 },
    "ac:winter_boots": { slot: "slot.armor.feet", cold_resistance: 2 }
};

const ICE_SKATE_BOOTS = ["ts:ice_skates", "ts:armored_ice_skates"];

let player_cold_immune = {};
let player_shiver_tick = {};
let player_ice_skate_speed = {};

export function getFrosColdResistance(player) {
    let resistance = 0;
    try {
        let equip = player.getComponent("minecraft:equippable");
        if (!equip) return 0;
        for (let [itemId, data] of Object.entries(COLD_ARMOR_ITEMS)) {
            let item = equip.getEquipment(data.slot);
            if (item && item.typeId === itemId) {
                resistance += data.cold_resistance;
                if (data.cold_resistance >= 99) return 99;
            }
        }
    } catch(e) {}
    return resistance;
}

function hasIceSkates(player) {
    try {
        let equip = player.getComponent("minecraft:equippable");
        if (!equip) return false;
        let boots = equip.getEquipment("slot.armor.feet");
        return boots && ICE_SKATE_BOOTS.includes(boots.typeId);
    } catch(e) { return false; }
}

function applyIceSkateBonus(player) {
    if (!hasIceSkates(player)) return;
    try {
        let block = player.dimension.getBlock({ x: Math.floor(player.location.x), y: Math.floor(player.location.y) - 1, z: Math.floor(player.location.z) });
        if (block && (block.typeId.includes("ice") || block.typeId.includes("ts:cut_blue_ice") || block.typeId.includes("ts:cut_packed_ice"))) {
            player.addEffect("speed", 10, { amplifier: 1, showParticles: false });
        }
    } catch(e) {}
}

function applyFrostEffects(player, bodyTemp, coldResistance) {
    const effectiveCold = bodyTemp + coldResistance;
    if (effectiveCold < FREEZE_THRESHOLD) {
        try {
            if (coldResistance < 99) {
                player.addEffect("slowness", 60, { amplifier: 1, showParticles: true });
                player.addEffect("weakness", 60, { amplifier: 0, showParticles: true });
                if (system.currentTick % 60 === 0) {
                    player.applyDamage(1, { cause: "freezing" });
                }
            }
        } catch(e) {}
    } else if (effectiveCold < COLD_THRESHOLD) {
        try {
            player.addEffect("slowness", 40, { amplifier: 0, showParticles: false });
        } catch(e) {}
    }
}

system.runInterval(() => {
    for (let player of world.getPlayers()) {
        if (player.getGameMode() === GameMode.creative || player.getGameMode() === GameMode.spectator) continue;

        let id = player.id;
        if (player_shiver_tick[id] === undefined) player_shiver_tick[id] = 0;

        try {
            let bodyTemp = player.getDynamicProperty("ts_body_temp") || 36;
            let coldResistance = getFrosColdResistance(player);

            applyFrostEffects(player, bodyTemp, coldResistance);
            applyIceSkateBonus(player);

            let isNearLight = player.getDynamicProperty("ts_near_light") || false;
            if (isNearLight && bodyTemp < 36) {
                let newTemp = Math.min(36, bodyTemp + 0.5);
                player.setDynamicProperty("ts_body_temp", newTemp);
            }
        } catch(e) {}
    }
}, 20);

world.afterEvents.itemUse.subscribe(e => {
    let player = e.source;
    if (!(player instanceof Player)) return;
    let item = e.itemStack;
    if (!item) return;

    if (item.typeId === "ts:frost_wand") {
        try {
            let forward = player.getViewDirection();
            let loc = player.location;
            let targetLoc = {
                x: loc.x + forward.x * 8,
                y: loc.y + 1 + forward.y * 8,
                z: loc.z + forward.z * 8
            };
            player.dimension.runCommand(`execute positioned ${Math.floor(targetLoc.x)} ${Math.floor(targetLoc.y)} ${Math.floor(targetLoc.z)} run particle minecraft:snowflake_particle ~ ~ ~`);
            let nearEntities = player.dimension.getEntities({ location: targetLoc, maxDistance: 5, excludeTypes: ["ts:frostologer"] });
            for (let entity of nearEntities) {
                if (entity.id === player.id) continue;
                try {
                    entity.addEffect("slowness", 100, { amplifier: 2, showParticles: true });
                    entity.addEffect("weakness", 100, { amplifier: 1, showParticles: true });
                } catch(e2) {}
            }
        } catch(e) {}
    }

    if (item.typeId === "ts:packed_snowball" || item.typeId === "ts:icicle") {
        try {
            let forward = player.getViewDirection();
            let loc = player.location;
            let spawnLoc = { x: loc.x + forward.x, y: loc.y + 1.6, z: loc.z + forward.z };
            player.dimension.spawnEntity("minecraft:snowball", spawnLoc);
        } catch(e) {}
    }
});

export function applyFrostifulEffects(player, bodyTemp) {
    let coldResistance = getFrosColdResistance(player);
    if (coldResistance >= 99) return;
    applyFrostEffects(player, bodyTemp, coldResistance);
}
