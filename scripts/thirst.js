import { world, system, CommandPermissionLevel, MolangVariableMap, ItemStack, BlockPermutation, BlockVolume } from "@minecraft/server";
import { getThirstItemData, LightSourceData, LightStats } from "./database";
import { Vector } from "./Vector3";
import { setUIData } from "./ui_handler";
import { getPlayerTemperatureEffect } from "./temperature";
import { AdventureCondimentModule } from "./module/AdventureCondimentModule";

let player_thirst = {};
let player_thirsty_duration = {};

export function setThirst(player, value){
    player_thirst[player.id] = Math.min(Math.max(value * 1200, 0), 24599);
    player.setDynamicProperty("thirst_property", player_thirst[player.id]);
    player.dimension.playSound("random.drink", player.getHeadLocation());
}
export function addThirst(player, value){
    player_thirst[player.id] = Math.min(Math.max(player_thirst[player.id] + value * 1200, 0), 24599);
    player.setDynamicProperty("thirst_property", player_thirst[player.id]);
    player.dimension.playSound("random.drink", player.getHeadLocation());
}

system.runInterval(()=>{
    for(let playerData of world.getPlayers()){
        let is_immune = playerData.getGameMode() == "Spectator" || playerData.getGameMode() == "Creative";

        if(player_thirst[playerData.id] == undefined){
            player_thirst[playerData.id] = playerData.getDynamicProperty("thirst_property");
            player_thirst[playerData.id] = player_thirst[playerData.id] == undefined ? 24000 : player_thirst[playerData.id];
            player_thirsty_duration[playerData.id] = 0;
        }

        if(!is_immune){
            let subtract = Vector.getLength(playerData.getVelocity()) * 5 + 1;
            let thirst_effect = 0;
            // if(configuration.getValue("ac:thirst")){
                if(playerData.isSprinting || playerData.isSwimming){
                    subtract += 3;
                }
                if(playerData.isJumping){
                    subtract += 4;
                }
                if(playerData.getEffect("fatal_poison") != undefined){
                    subtract += 10 * (playerData.getEffect("fatal_poison").amplifier + 1);
                    thirst_effect = 1;
                }
                if(playerData.getEffect("poison") != undefined && thirst_effect != 1){
                    if(player_thirst[playerData.id] > 180) subtract += 4 * (playerData.getEffect("poison").amplifier + 1);
                    thirst_effect = 1;
                }
                let is_thirsty = playerData.getDynamicProperty("thirsty_effect") > system.currentTick;
                if(is_thirsty && thirst_effect != 1){
                    if(player_thirst[playerData.id] > 180) subtract += 16;
                    thirst_effect = 2;
                }
                if(playerData.getEffect("hunger") != undefined){
                    if(player_thirst[playerData.id] > 60){
                        subtract += 0.1;
                        subtract *= 2 + playerData.getEffect("hunger").amplifier / 5;
                    }
                    thirst_effect = 2;
                }
                
                let temperature_effect = getPlayerTemperatureEffect(playerData);
                if(temperature_effect > 0){
                    subtract += temperature_effect;
                    thirst_effect = 3;
                }else if(temperature_effect < 0){
                    subtract += 1;
                    thirst_effect = 4;
                }

                player_thirst[playerData.id] = Math.max(0, player_thirst[playerData.id] - subtract);
            // console.warn(player_thirst[playerData.id])
            if(player_thirst[playerData.id] < 10){
                playerData.addEffect("hunger", 20, {amplifier: Math.min(10, player_thirsty_duration[playerData.id] / 120), showParticles: false});
                let saturation = playerData.getComponent("minecraft:player.saturation");
                if(player_thirsty_duration[playerData.id] % 60 == 0 && saturation.currentValue > 0){
                    saturation.setCurrentValue(Math.max(0, saturation.currentValue - 1));
                }
                player_thirsty_duration[playerData.id] += 1;
            }else{
                if(player_thirsty_duration[playerData.id] > 0) player_thirsty_duration[playerData.id] = 0;
            }

            if(world.getDifficulty() == "Peaceful" && player_thirst[playerData.id] < 24200){
                player_thirst[playerData.id] = Math.min(player_thirst[playerData.id] + 100, 24000);
            }

            if(temperature_effect < 0){
                setUIData(playerData, "thirst_bar", 20);
            }else{
                setUIData(playerData, "thirst_bar", Math.min(20, Math.ceil(player_thirst[playerData.id] / 1200)));
            }
            setUIData(playerData, "thirst_effect", thirst_effect);

            playerData.setDynamicProperty("thirst_property", player_thirst[playerData.id])
            
            if(player_thirst[playerData.id] < 7200){
                let display = (1 - Math.min(1, (player_thirst[playerData.id] / 2400) / 3)) * 125;
                display += Math.sin(system.currentTick / 20) * 0.2 * display;

                setUIData(playerData, "thirst_effect_display", Math.min(Math.round(display), 99));
            }else{
                setUIData(playerData, "thirst_effect_display", 0);
            }
        }
        // }

        if(system.currentTick % 4 == 0) system.sendScriptEvent("ac:send_thirst_data", JSON.stringify({
            target_id: playerData.id,
            thirst: Math.min(20, Math.ceil(player_thirst[playerData.id] / 1200)), 
            thirst_exhaustion: Math.round((Number(player_thirst[playerData.id]) % 1200) / 60)
        }))
    }
});

world.afterEvents.playerSpawn.subscribe(s=>{
    if(s.initialSpawn) return;
    s.player.setDynamicProperty("thirst_property", 24000);
    player_thirst[s.player.id] = 24000;
});

const ScanPosition = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 10 },
    { x: 10, y: 0, z: -10 },
    { x: -10, y: 0, z: 10 },
    { x: -10, y: 0, z: -10 }
]

world.afterEvents.entityHitBlock.subscribe(s=>{
    if(s.damagingEntity.getComponent("minecraft:equippable").getEquipment("Mainhand") != undefined) return;

    let block = s.damagingEntity.getBlockFromViewDirection({ includeLiquidBlocks: true });
    if(block != undefined && player_thirst[s.damagingEntity.id] < 23900){
        if(block.block.permutation.matches("minecraft:water") || block.block.permutation.matches("minecraft:flowing_water")){
            player_thirst[s.damagingEntity.id] = Math.min(player_thirst[s.damagingEntity.id] + 2400 + (1200 * Math.random()), 24599);
            s.damagingEntity.setDynamicProperty("thirst_property", player_thirst[s.damagingEntity.id]);
            s.damagingEntity.dimension.playSound("random.drink", s.damagingEntity.getHeadLocation());
            
            if(Math.random() <= 0.15){
                s.damagingEntity.setDynamicProperty("thirsty_effect", system.currentTick + 300);
            }else if(Math.random() <= 0.75){ 
                let is_in_river = false;
                for(let scan of ScanPosition){
                    let entity = block.block.dimension.spawnEntity("ac:temperature_checker", Vector.add(block.block.location, scan));
                    is_in_river = entity.getProperty("ac:is_in_river");
                    entity.remove();
                    if(is_in_river) break;
                }
                if(!is_in_river) s.damagingEntity.setDynamicProperty("thirsty_effect", system.currentTick + 300);
            }
        }
    }
}, {entityTypes: [ "minecraft:player" ]})


world.afterEvents.itemCompleteUse.subscribe(s=>{
    let is_dirty = false;
    if(s.itemStack.typeId == "minecraft:potion"){
        player_thirst[s.source.id] = Math.min(player_thirst[s.source.id] + 3000 + parseInt(Math.random() * 500), 24599);
        s.source.setDynamicProperty("thirst_property", player_thirst[s.source.id]);
    }else if(s.itemStack.typeId == "ac:water_flask"){
        let lore = s.itemStack.getLore();
        let item = s.itemStack.clone();
        if(item.getComponent("minecraft:durability").damage < 8){
            if(lore.includes("§r§9Purified") && item.getComponent("minecraft:durability").damage == 7){
                lore.pop("§r§9Purified");
                item.setLore(lore);
            }
            item.getComponent("minecraft:durability").damage += 1;
            s.source.getComponent("minecraft:equippable").setEquipment("Mainhand", item);
            
            player_thirst[s.source.id] = Math.min(player_thirst[s.source.id] + 3600, 24599);
            s.source.setDynamicProperty("thirst_property", player_thirst[s.source.id]);
        }
    }else{
        if(getThirstItemData()[s.itemStack.typeId]){
            player_thirst[s.source.id] = Math.min(Math.max(player_thirst[s.source.id] + getThirstItemData()[s.itemStack.typeId].value * 1200, 0), 24599);
            s.source.setDynamicProperty("thirst_property", player_thirst[s.source.id]);
            if(getThirstItemData()[s.itemStack.typeId].is_dirty) is_dirty = true;
        }else{
            if(player_thirst[s.source.id] < 24599){
                let subtract = 0;
                if(s.itemStack.hasTag("minecraft:is_cooked")){
                    subtract = 3600;
                }else if(s.itemStack.hasTag("minecraft:is_meat")){
                    subtract = 2400;
                }else if(s.itemStack.hasTag("minecraft:is_food")){
                    subtract = 1200;
                }
                player_thirst[s.source.id] = Math.max(player_thirst[s.source.id] - subtract - parseInt(Math.random() * 500), 0);
                s.source.setDynamicProperty("thirst_property", player_thirst[s.source.id]);
            }
        }
    }
    
    if(!is_dirty) is_dirty = s.itemStack.getLore().includes("§7§3§r§2Dirty§2");
    if(is_dirty && Math.random() < 0.35) s.source.setDynamicProperty("thirsty_effect", system.currentTick + 300);
})

world.afterEvents.playerInteractWithBlock.subscribe(s=>{
    if((s.block.typeId == "minecraft:water" || s.block.typeId == "minecraft:flowing_water" || s.block.isWaterlogged) && s.itemStack.typeId == "ac:water_flask"){
        let item = s.itemStack.clone();
        let durability = item.getComponent("minecraft:durability");
        if(durability.damage > 0){
            durability.damage -=1;
            s.player.getComponent("minecraft:equippable").setEquipment("Mainhand", item);
        }
    }
})

world.beforeEvents.itemUse.subscribe(s=>{
    if(s.itemStack.typeId == "ac:water_flask"){
        let durability = s.itemStack.getComponent("minecraft:durability");
        if(durability.damage >= durability.maxDurability){
            s.cancel = true;
        }
    }
})


export function handleThirstCommand(e, target, param, value){
    if(param == "set" && (value > 20 ||  value < 0)){
        return {
            message: `The value you can set is in range (0 to 20)`,
            status: 1
        }
    }
    if(param == "add" && (value > 20 ||  value < -20)){
        return {
            message: `The value you can add is in range (-20 to 20)`,
            status: 1
        }
    }
    for(let player of target){
        let gamemode = player.getGameMode();
        if(gamemode == "Survival" || gamemode == "Adventure"){
            if(param == "add"){
                player_thirst[player.id] = Math.min(Math.max(player_thirst[player.id] + value * 1200, 0), 24599);
            }else if(param == "set"){
                player_thirst[player.id] = Math.min(Math.max(value * 1200, 0), 24599);
            }
            player.setDynamicProperty("thirst_property", player_thirst[player.id]);
            if(value > 0) system.run(()=>{
                player.dimension.playSound("random.drink", player.getHeadLocation());
            })
        }
    }

    return {
        message: `Applied thirst to ${target.map(t => t.name).join(", ")}`,
        status: 0
    }
}


export function handleThirstyEffect(e, target, param, effect, seconds){
    for(let player of target){
        if(param == "set"){
            player.setDynamicProperty("thirsty_effect", system.currentTick + seconds * 20);

            return {
                message: `Applied thirsty effect to ${target.map(t => t.name).join(", ")}`,
                status: 0
            }
        }else if(param == "clear"){
            player.setDynamicProperty("thirsty_effect", system.currentTick - 1);

            return {
                message: `Cleared thirsty effect to ${target.map(t => t.name).join(", ")}`,
                status: 0
            }
        }
    }
}