import { world, system, ItemStack, ItemTypes, BlockPermutation, BlockTypes } from "@minecraft/server";
import { FOOD_DATABASE } from "./vanilla_food_db";
import { drinkHandler } from "./hot_and_cold_drink";

export let LightSourceData = {
    "minecraft:beacon": 15,
    "minecraft:cauldron": 15,
    "minecraft:end_gateway": 15,
    "minecraft:fire": 15,
    "minecraft:flowing_lava": 15,
    "minecraft:lava": 15,
    "minecraft:glowstone": 15,
    "minecraft:lit_pumpkin": 15,
    "minecraft:lit_redstone_lamp": 15,
    "minecraft:sea_lantern": 15,
    "minecraft:sea_pickle": 15,
    "minecraft:shroomlight": 15,
    "minecraft:conduit": 15,
    "minecraft:lantern": 15,
    "minecraft:campfire": 15,
    "ac:lit_campfire_with_boiler": 15,
    "minecraft:end_rod": 14,
    "minecraft:torch": 14,
    // "minecraft:colored_torch": 14,
    // "minecraft:underwater_torch": 14,
    "minecraft:lit_furnace": 13,
    "minecraft:lit_blast_furnace": 13,
    "minecraft:lit_smoker": 13,
    "minecraft:enchanting_table": 12,
    "minecraft:crying_obsidian": 12,
    "minecraft:portal": 11,
    "minecraft:crying_obsidian": 10,
    "minecraft:soul_fire": 10,
    "minecraft:soul_campfire": 10,
    "minecraft:soul_lantern": 10,
    "minecraft:soul_torch": 10,
    "minecraft:lit_redstone_ore": 9,
    "minecraft:ender_chest": 7,
    "minecraft:redstone_torch": 7
}

export let TemperatureAdditionBlockData = {
    "minecraft:fire": {
        states: {},
        temperature: 2,
        distance: 8
    },
    "minecraft:flowing_lava":  {
        states: {},
        temperature: 2,
        distance: 3
    },
    "minecraft:lava":  {
        states: {},
        temperature: 4,
        distance: 3
    },
    "minecraft:lit_furnace":  {
        states: {},
        temperature: 6,
        distance: 6
    },
    "minecraft:lit_blast_furnace": {
        states: {},
        temperature: 6,
        distance: 6
    },
    "minecraft:lit_smoker": {
        states: {},
        temperature: 6,
        distance: 6
    },
    "minecraft:soul_fire": {
        states: {},
        temperature: 1,
        distance: 8
    }
}

export const LightStats = {
    "minecraft:cauldron": {
        "cauldron_liquid": "lava"
    },
    "minecraft:sea_pickle": {
        "dead_bit": false
    },
    "minecraft:campfire": {
        "extinguished": false
    },
    "minecraft:soul_campfire": {
        "extinguished": false
    }
}

var sorted_light = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
    13: [],
    14: [],
    15: [],
    16: []
};

function sortLightData(){
    for(let data of Object.keys(LightSourceData)){
        sorted_light[LightSourceData[data]].push(data);
    }
}

sortLightData();

export function getLightSourceData(){
    return sorted_light;
}

export var ArmorTemperatureData = {
    "minecraft:leather_helmet": {
        temperature_resistance: 0,
        temperature_insulation: true
    },
    "minecraft:leather_chestplate": {
        temperature_resistance: 0,
        temperature_insulation: true
    },
    "minecraft:leather_leggings": {
        temperature_resistance: 0,
        temperature_insulation: true
    },
    "minecraft:leather_boots": {
        temperature_resistance: 0,
        temperature_insulation: true
    },
    
    "minecraft:iron_helmet": {
        temperature_resistance: 0.5,
        temperature_insulation: false
    },
    "minecraft:iron_chestplate": {
        temperature_resistance: 0.5,
        temperature_insulation: false
    },
    "minecraft:iron_leggings": {
        temperature_resistance: 0.5,
        temperature_insulation: false
    },
    "minecraft:iron_boots": {
        temperature_resistance: 0.5,
        temperature_insulation: false
    },
    
    "minecraft:golden_helmet": {
        temperature_resistance: 1.5,
        temperature_insulation: false
    },
    "minecraft:golden_chestplate": {
        temperature_resistance: 1.5,
        temperature_insulation: false
    },
    "minecraft:golden_leggings": {
        temperature_resistance: 1.5,
        temperature_insulation: false
    },
    "minecraft:golden_boots": {
        temperature_resistance: 1.5,
        temperature_insulation: false
    },
    
    "minecraft:diamond_helmet": {
        temperature_resistance: 1,
        temperature_insulation: false
    },
    "minecraft:diamond_chestplate": {
        temperature_resistance: 1,
        temperature_insulation: false
    },
    "minecraft:diamond_leggings": {
        temperature_resistance: 1,
        temperature_insulation: false
    },
    "minecraft:diamond_boots": {
        temperature_resistance: 1,
        temperature_insulation: false
    },
    
    "minecraft:netherite_helmet": {
        temperature_resistance: 2,
        temperature_insulation: false
    },
    "minecraft:netherite_chestplate": {
        temperature_resistance: 2,
        temperature_insulation: false
    },
    "minecraft:netherite_leggings": {
        temperature_resistance: 2,
        temperature_insulation: false
    },
    "minecraft:netherite_boots": {
        temperature_resistance: 2,
        temperature_insulation: false
    },
    
    "ac:winter_hood": {
        temperature_resistance: -2,
        temperature_insulation: false
    },
    "ac:winter_coat": {
        temperature_resistance: -4,
        temperature_insulation: false
    },
    "ac:winter_leggings": {
        temperature_resistance: -3,
        temperature_insulation: false
    },
    "ac:winter_boots": {
        temperature_resistance: -1,
        temperature_insulation: false
    },
    
    "ac:desert_hood": {
        temperature_resistance: 2,
        temperature_insulation: false
    },
    "ac:desert_robe": {
        temperature_resistance: 4,
        temperature_insulation: false
    },
    "ac:desert_leggings": {
        temperature_resistance: 3,
        temperature_insulation: false
    },
    "ac:desert_boots": {
        temperature_resistance: 1,
        temperature_insulation: false
    },

    "ts:sun_hat": {
        temperature_resistance: 3,
        temperature_insulation: false
    },
    "ts:turtle_helmet": {
        temperature_resistance: 0,
        temperature_insulation: false
    },
    "ts:turtle_leggings": {
        temperature_resistance: 1,
        temperature_insulation: false
    },
    "ts:turtle_boots": {
        temperature_resistance: 1,
        temperature_insulation: false
    },

    "ts:fur_helmet": {
        temperature_resistance: -2,
        temperature_insulation: true
    },
    "ts:fur_chestplate": {
        temperature_resistance: -4,
        temperature_insulation: true
    },
    "ts:fur_leggings": {
        temperature_resistance: -3,
        temperature_insulation: true
    },
    "ts:fur_boots": {
        temperature_resistance: -1,
        temperature_insulation: true
    },

    "ts:fur_padded_chainmail_helmet": {
        temperature_resistance: -2.5,
        temperature_insulation: true
    },
    "ts:fur_padded_chainmail_chestplate": {
        temperature_resistance: -4.5,
        temperature_insulation: true
    },
    "ts:fur_padded_chainmail_leggings": {
        temperature_resistance: -3.5,
        temperature_insulation: true
    },
    "ts:fur_padded_chainmail_boots": {
        temperature_resistance: -1.5,
        temperature_insulation: true
    },

    "ts:ice_skates": {
        temperature_resistance: -0.5,
        temperature_insulation: false
    },
    "ts:armored_ice_skates": {
        temperature_resistance: -1,
        temperature_insulation: false
    },

    "ts:frostology_cloak": {
        temperature_resistance: -5,
        temperature_insulation: true
    }
}


export function getArmorTemperatureData(){
    return ArmorTemperatureData;
}


export var ThirstItemData = {
    "minecraft:glow_berries": {
        value: 1,
        is_dirty: false
    },
    "minecraft:sweet_berries": {
        value: 1,
        is_dirty: false
    },
    "minecraft:enchanted_golden_apple": {
        value: 2,
        is_dirty: false
    },
    "minecraft:golden_apple": {
        value: 2,
        is_dirty: false
    },
    "minecraft:apple": {
        value: 2,
        is_dirty: false
    },
    "minecraft:glistering_melon_slice": {
        value: 4,
        is_dirty: false
    },
    "minecraft:melon_slice": {
        value: 4,
        is_dirty: false
    },
    "minecraft:mushroom_stew": {
        value: 3,
        is_dirty: false
    },
    "minecraft:rabbit_stew": {
        value: 3,
        is_dirty: false
    },
    "minecraft:suspicious_stew": {
        value: 3,
        is_dirty: false
    },
    "minecraft:beetroot_soup": {
        value: 3,
        is_dirty: false
    },
    "minecraft:milk_bucket": {
        value: 6,
        is_dirty: false
    },
    "minecraft:potion": {
        value: 3,
        is_dirty: false
    },
    "ac:water_flask": {
        value: 3,
        is_dirty: false
    },
}


function sendThirstItemDatabaseAPI(id){
    system.run(()=>system.sendScriptEvent("ac:send_thirst_item_db", id + "-D-" +JSON.stringify(ThirstItemData[id])))
}

Object.keys(ThirstItemData).forEach(food_id =>{
    sendThirstItemDatabaseAPI(food_id);
})

Object.keys(FOOD_DATABASE).forEach(food_id =>{
    if(ThirstItemData[food_id] == undefined){
        ThirstItemData[food_id] = {
            value: FOOD_DATABASE[food_id].saturationModifier * -2.5,
            is_dirty: false
        }
        sendThirstItemDatabaseAPI(food_id);
    }
})

export function getThirstItemData(){
    return ThirstItemData;
}

const MAX_ITEMS_ITERATION = 50;

const SIDES = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
    { x: 1, y: 0, z: 1 },
    { x: -1, y: 0, z: 1 },
    { x: -1, y: 0, z: -1 },
    { x: 1, y: 0, z: -1 },
]

system.beforeEvents.startup.subscribe(s => {
    s.itemComponentRegistry.registerCustomComponent("adventure_condiment:temperature", {});
    s.itemComponentRegistry.registerCustomComponent("adventure_condiment:thirst", {});
    s.itemComponentRegistry.registerCustomComponent("adventure_condiment:hot_and_cold_drink", {
        onConsume: (e, f) => {
            drinkHandler(e, f);
        }
    });

    s.blockComponentRegistry.registerCustomComponent("adventure_condiment:heat_emission", {});
    s.blockComponentRegistry.registerCustomComponent("adventure_condiment:temperature", {});
    s.blockComponentRegistry.registerCustomComponent("adventure_condiment:emberbloom", {
        onTick: e => {
            try {
                let above = e.block.above();
                if(above?.typeId == "minecraft:snow_layer"){
                    above.setPermutation(BlockPermutation.resolve("minecraft:air"));
                }
                if(Math.random() < 0.05){
                    let side = e.block.offset(SIDES[Math.floor((Math.random() * SIDES.length * 2) % SIDES.length)]);
                    if(side?.typeId != "minecraft:snow_layer") side = side.above();
                    if(side?.typeId == "minecraft:snow_layer"){
                        let permutation = side.permutation;
                        let height = permutation.getState("height");
                        if(height > 0){
                            side.setPermutation(permutation.withState("height", height - 1));
                        }
                    }
                }
                if(Math.random() < 0.05) e.dimension.spawnParticle("ac:emberbloom_particle", e.block.location);
            } catch (error) {
                
            }
        }
    });
});

system.run(()=>{
    let all_item = ItemTypes.getAll();
    let item_length = all_item.length;
    let iteration = 0;
    let run_id = system.runInterval(()=>{
        for (let i = 0; i < MAX_ITEMS_ITERATION; i++) {
            if (iteration >= item_length){
                system.clearRun(run_id);
                return;
            }

            let item = new ItemStack(all_item[iteration]);

            if(item.hasComponent("adventure_condiment:temperature")){
                let component = item.getComponent("adventure_condiment:temperature");
                if(typeof component.customComponentParameters.params.temperature_insulation !== "boolean" || typeof component.customComponentParameters.params.temperature_resistance !== "number"){
                    console.warn(`[AdventureCondimentAPI] Invalid conponent adventure_condiment:temperature syntax in item ${item.typeId}.`);
                }else{
                    ArmorTemperatureData[item.typeId] = component.customComponentParameters.params;
                    console.log(`[AdventureCondimentAPI] Registering ${item.typeId} to temperature item database.`);
                }
            }

            if(item.hasComponent("adventure_condiment:thirst")){
                let component = item.getComponent("adventure_condiment:thirst");
                if(typeof component.customComponentParameters.params.is_dirty !== "boolean" || typeof component.customComponentParameters.params.value !== "number"){
                    console.warn(`[AdventureCondimentAPI] Invalid conponent adventure_condiment:thirst syntax item ${item.typeId}.`);
                }else{
                    ThirstItemData[item.typeId] = component.customComponentParameters.params;
                    console.log(`[AdventureCondimentAPI] Registering ${item.typeId} to thirst item database.`);
                    sendThirstItemDatabaseAPI(item.typeId);
                }
            }else if(item.hasComponent("adventure_condiment:food")){
                if(ThirstItemData[item.typeId] == undefined){
                    ThirstItemData[item.typeId] = {
                        value: item.getComponent("adventure_condiment:food").saturationModifier * -2.5,
                        is_dirty: false
                    }
                    sendThirstItemDatabaseAPI(item.typeId);
                }
            }
            
            iteration++;
        }
    });
});


system.afterEvents.scriptEventReceive.subscribe(s=>{
    if(s.id == "ac:register_api"){
        let data = s.message.split(" ");
        if(data.length != 4){
            console.warn(`[AdventureCondimentAPI] Invalid register syntax.`);
        }else{
            if(data[0] == "register_temperature"){
                ArmorTemperatureData[data[1]] = {
                    temperature_resistance: Number(data[2]),
                    temperature_insulation: data[3] == "1"
                }
            }else if(data[0] == "register_thirst"){
                ThirstItemData[data[1]] = {
                    value: Number(data[2]),
                    is_dirty: data[3] == "1"
                }
            }
        }
    }
}, { namespaces: [ "ac" ]});