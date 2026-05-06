import { world, system, CommandPermissionLevel } from "@minecraft/server";
import { setUIData } from "./ui_handler";
import { ForgingTableModule } from "./module/ForgingTableModule";
import { getArmorTemperatureData } from "./database";

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function generateLoreItem(item, temperature){
    let display_buffer = item.getDynamicProperty("ac:display_buffer_resistance");
    let lore = item.getLore();
    let add_lore = [
        "§r§i§r§i§r§9+" + Math.abs(temperature) + (temperature < 0 ? " Cold Resistance" : " Heat Resistance")
    ]
    if(temperature == 0) add_lore = [];
    item.setDynamicProperty("ac:display_buffer_resistance", add_lore[0]);
    lore.forEach(l =>{
        if(display_buffer != l){
            add_lore.push(l);
        }
    });
    item.setLore(add_lore);
    return item;
}

export function generateInsulationLoreItem(item){
    let display_buffer = item.getDynamicProperty("ac:display_buffer_insulation");
    let lore = item.getLore();
    let add_lore = [
        "§r§i§r§i§r§9+1 Temperature Insulation"
    ]
    item.setDynamicProperty("ac:display_buffer_insulation", add_lore[0]);
    lore.forEach(l =>{
        if(display_buffer != l){
            add_lore.push(l);
        }
    });
    item.setLore(add_lore);
    return item;
}


let player_temperatue_resistance_temporary_modifier = {};
let player_temperatue_insulation_temporary_modifier = {};

world.beforeEvents.playerLeave.subscribe(s =>{
    s.player.setDynamicProperty("player_temperatue_resistance_temporary_modifier", JSON.stringify(player_temperatue_resistance_temporary_modifier[s.player.id]));
    s.player.setDynamicProperty("player_temperatue_insulation_temporary_modifier", JSON.stringify(player_temperatue_insulation_temporary_modifier[s.player.id]));
})
system.beforeEvents.shutdown.subscribe(s =>{
    for(let playerData of world.getPlayers()){
        playerData.setDynamicProperty("player_temperatue_resistance_temporary_modifier", JSON.stringify(player_temperatue_resistance_temporary_modifier[playerData.id]));
        playerData.setDynamicProperty("player_temperatue_insulation_temporary_modifier", JSON.stringify(player_temperatue_insulation_temporary_modifier[playerData.id]));
    }
})

let OxygenContainerDatabase = {};
system.run(()=>{
    OxygenContainerDatabase = world.getDynamicProperty("oxygen_database"); 
    if(OxygenContainerDatabase == undefined){
        OxygenContainerDatabase = {};
    }else{
        OxygenContainerDatabase = JSON.parse(OxygenContainerDatabase);
    }
})

const EquipmentList = [ "Head", "Chest", "Feet", "Legs" ];
let player_temperature_resistance = {};
let player_temperature_insulation = {};

export function getTemperatureResistance(player){
    return player_temperature_resistance[player.id] || 0;
}

export function getTemperatureInsulation(player){
    return player_temperature_insulation[player.id] || 0;
}

system.runInterval(()=>{
    if(system.currentTick % 20 == 0){
        world.setDynamicProperty("oxygen_database", JSON.stringify(OxygenContainerDatabase));
    }

    for(let playerData of world.getPlayers()){

        if(player_temperatue_resistance_temporary_modifier[playerData.id] == undefined) player_temperatue_resistance_temporary_modifier[playerData.id] = JSON.parse(playerData.getDynamicProperty("player_temperatue_resistance_temporary_modifier") || '{}');
        if(player_temperatue_insulation_temporary_modifier[playerData.id] == undefined) player_temperatue_insulation_temporary_modifier[playerData.id] = JSON.parse(playerData.getDynamicProperty("player_temperatue_insulation_temporary_modifier") || '{}');
        
        let equippable = playerData.getComponent("minecraft:equippable");
        let head = equippable.getEquipment("Head");
        let use_diving_helmet = 0;
        let capacity_diving_helmet = 0;
        let water_breathing = playerData.getEffect("water_breathing");
        if(head != undefined && head.typeId == "ac:diving_helmet"){
            let id = head.getDynamicProperty("oxygen_id");
            if(id == undefined || (id != undefined && OxygenContainerDatabase[id] == undefined)){
                let id_new = generateRandomString(5);
                head.setDynamicProperty("oxygen_id", id_new);
                capacity_diving_helmet = 99;
                OxygenContainerDatabase[id_new] = 12000;
                playerData.getComponent("minecraft:equippable").setEquipment("Head", head);
            }else{
                let oxygen_capacity = OxygenContainerDatabase[id];

                if(playerData.isInWater && (water_breathing == undefined || water_breathing.duration <= 10)){
                    if(oxygen_capacity > 0){
                        oxygen_capacity -= 2;
                        playerData.addEffect("water_breathing", 10, { showParticles: false } );
                    }
                }else{
                    if(oxygen_capacity < 12000) oxygen_capacity += 4;
                }

                OxygenContainerDatabase[id] = oxygen_capacity;
                
                capacity_diving_helmet = parseInt(oxygen_capacity / 12000 * 99);
            }
            use_diving_helmet = 1;
        };

        let temperature_resistance = 0;
        let temperature_insulation = 0;
        EquipmentList.forEach(slot =>{
            let item = equippable.getEquipment(slot);
            if(item){
                temperature_resistance += item.getDynamicProperty("temperature_resistance") || 0;
                temperature_insulation += item.getDynamicProperty("temperature_insulation") || 0;
                let armor_data = getArmorTemperatureData()[item.typeId];
                if(armor_data != undefined){
                    temperature_resistance += armor_data.temperature_resistance || 0;
                }
            }
        })
        
        let temeprature_resistance_temp_keys = Object.keys(player_temperatue_resistance_temporary_modifier[playerData.id]);
        temeprature_resistance_temp_keys.forEach(key =>{
            temperature_resistance += player_temperatue_resistance_temporary_modifier[playerData.id][key];
        })
        let temeprature_insulation_temp_keys = Object.keys(player_temperatue_insulation_temporary_modifier[playerData.id]);
        temeprature_insulation_temp_keys.forEach(key =>{
            temperature_insulation += player_temperatue_insulation_temporary_modifier[playerData.id][key];
        })
        
        if(temperature_resistance > 0){
            setUIData(playerData, "heat_resistance", Math.min(20, Math.round(temperature_resistance)));
            setUIData(playerData, "cold_resistance", 0);
        }else{
            setUIData(playerData, "heat_resistance", 0);
            setUIData(playerData, "cold_resistance", Math.min(20, Math.round(-temperature_resistance)));
        }

        player_temperature_resistance[playerData.id] = temperature_resistance;
        player_temperature_insulation[playerData.id] = Math.max(0, temperature_insulation);

        setUIData(playerData, "use_diving_helmet", use_diving_helmet);
        setUIData(playerData, "capacity_diving_helmet", capacity_diving_helmet);
    };
});

world.afterEvents.entityDie.subscribe(s=>{
    if(!world.gameRules.keepInventory){
        player_temperatue_insulation_temporary_modifier[s.deadEntity.id] = {};
        player_temperatue_resistance_temporary_modifier[s.deadEntity.id] = {};
    } 
}, { entityTypes: [ "minecraft:player" ]});

ForgingTableModule.registerForgingRecipe({
    primary: {
        tag: [ "minecraft:is_armor" ]
    },
    secondary: {
        item: [ "ac:cold_resistance_fabric", "ac:heat_resistance_fabric" ]
    },
    tool: {
        item: "ac:sewing_tool"
    },
    cost: 1
}, data =>{
    let temperature_resistance = data.result.getDynamicProperty("temperature_resistance") || 0;
    if(data.secondary.typeId == "ac:cold_resistance_fabric"){
        if(temperature_resistance <= -5){
            data.cancel = true;
            return;
        }
        temperature_resistance -= 1;
    }else{
        if(temperature_resistance >= 5){
            data.cancel = true;
            return;
        }
        temperature_resistance += 1;
    }

    data.result.setDynamicProperty("temperature_resistance", temperature_resistance);
    let armor_data = getArmorTemperatureData()[data.result.typeId];
    let add = 0;
    if(armor_data != undefined && armor_data.temperature_resistance != 0){
        add = armor_data.temperature_resistance;
    }

    data.result = generateLoreItem(data.result, temperature_resistance + add);

    data.primary = undefined;
    
    if(data.secondary.amount > 1){
        data.secondary.amount -= 1;
    }else{
        data.secondary = undefined;
    }
    let tool_durability = data.tool.getComponent("minecraft:durability");
    // console.warn(tool_durability.damage, tool_durability.maxDurability, temperature_resistance)
    if(tool_durability.damage < tool_durability.maxDurability){
        tool_durability.damage += 1;
    }else{
        data.tool = undefined;
    }
});

ForgingTableModule.registerForgingRecipe({
    primary: {
        tag: [ "minecraft:is_armor" ]
    },
    tool: {
        tag: "minecraft:leather_tier"
    },
    cost: 1
}, data =>{
    let temperature_resistance = data.result.getDynamicProperty("temperature_insulation") || 0;
    if(temperature_resistance > 0){
        data.cancel = true;
        return;
    }
    
    let result_enchantable = data.result.getComponent("minecraft:enchantable");
    let tool_enchantable = data.tool.getComponent("minecraft:enchantable");

    if(result_enchantable.slots[0] != tool_enchantable.slots[0]){
        data.cancel = true;
        return;
    }
    
    data.result = generateInsulationLoreItem(data.result);
    data.result.setDynamicProperty("temperature_insulation", 1);
    data.primary = undefined;
    data.tool = undefined;
});

export function handleTemperatureAttributeCommand(e, target, attribute, param, identifier, value){
    if(param == "add" && value == undefined){
        return {
            message: `You need define value to add temperature modifier`,
            status: 1
        }
    }
    // if(param == "add" && attribute == "insulation" && (value < 0 || value > 1)){
    //     return {
    //         message: `The value you can add for insulation is 0 or 1`,
    //         status: 1
    //     }
    // }

    for(let player of target){
        if(attribute == "resistance"){
            if(param == "add"){
                player_temperatue_resistance_temporary_modifier[player.id][identifier] = value;
            }else if(param == "remove"){
                delete player_temperatue_resistance_temporary_modifier[player.id][identifier];
            }
        }else if(attribute == "insulation"){
            if(param == "add"){
                player_temperatue_insulation_temporary_modifier[player.id][identifier] = value;
            }else if(param == "remove"){
                delete player_temperatue_insulation_temporary_modifier[player.id][identifier];
            }
        }
    }

    return {
        message: `Applied ${param} temperature ${attribute} to ${target.map(t => t.name).join(", ")}`,
        status: 0
    }
}