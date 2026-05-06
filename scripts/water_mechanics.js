import { world, system, ItemStack } from "@minecraft/server";
import { setUIData } from "./ui_handler";
import { getPlayerTemperatureEffect, getPlayerTemperature } from "./temperature";

let local_random_value = {};
let player_soaked_duration = {};
let soaked_level = {};

let empty_bucket;

system.run(()=>{
    empty_bucket = new ItemStack("minecraft:bucket");
})

export function getPlayerSoakedLevel(player){
    return soaked_level[player.id] || 0;
}

system.runInterval(()=>{
    for(let playerData of world.getPlayers()){
        if(local_random_value[playerData.id] == undefined){
            local_random_value[playerData.id] = Math.random();
            player_soaked_duration[playerData.id] = 0;
            soaked_level[playerData.id] = 0;
        }

        let in_water = playerData.isInWater;
        if(player_soaked_duration[playerData.id] < 600 && system.currentTick % 20 == Math.round(local_random_value[playerData.id] * 20)){
            if(!in_water){
                try {
                    let entity = playerData.dimension.spawnEntity("ac:temperature_checker", playerData.location);
                    in_water = entity.getProperty("ac:in_water_or_rain");
                    entity.remove();
                } catch (error) {
                    
                }
            }
            if(in_water){
                player_soaked_duration[playerData.id] += 40;
            }
        }else{
            let temperature = getPlayerTemperature(playerData);
            if(!in_water){
                if(temperature > 48){
                    player_soaked_duration[playerData.id] = Math.max(0, player_soaked_duration[playerData.id] - ((temperature - 48) / 20));
                }else if(temperature < 10){
                    player_soaked_duration[playerData.id] = Math.max(0, player_soaked_duration[playerData.id] + Math.min(0.9, -(temperature - 10) / 20));
                }
            }
            player_soaked_duration[playerData.id] = Math.max(0, player_soaked_duration[playerData.id] - 1);
        }

        if(player_soaked_duration[playerData.id] > 150){
            soaked_level[playerData.id] = 2;
        }else if(player_soaked_duration[playerData.id] > 20){
            soaked_level[playerData.id] = 1;
        }else{
            soaked_level[playerData.id] = 0;
        }
        setUIData(playerData, "soaked", soaked_level[playerData.id]);

        if(!in_water){
            if(soaked_level[playerData.id] > 0 && system.currentTick % 20 == Math.round(local_random_value[playerData.id] * 20)){
                playerData.dimension.spawnParticle("ac:water_soaked", playerData.location);
            }
            if(soaked_level[playerData.id] > 1 && system.currentTick % 40 == Math.round(local_random_value[playerData.id] * 40)){
                playerData.dimension.spawnParticle("ac:water_soaked", playerData.location);
            }
        }
    }
})


world.afterEvents.playerSpawn.subscribe(s=>{
    if(s.initialSpawn) return;
    player_soaked_duration[s.player.id] = 0;
    soaked_level[s.player.id] = 0;
});

world.afterEvents.entityDie.subscribe(s=>{
    player_soaked_duration[s.deadEntity.id] = 0;
    soaked_level[s.deadEntity.id] = 0;
}, { entityTypes: [ "minecraft:player" ]});

let player_place_water_bucket = {};

world.afterEvents.playerInteractWithBlock.subscribe(s=>{
    if(s.itemStack?.typeId == "minecraft:water_bucket") player_place_water_bucket[s.player.id] = true;
});
world.afterEvents.itemUse.subscribe(s=>{
    if(s.itemStack?.typeId == "minecraft:water_bucket") system.run(()=>{
        if(!player_place_water_bucket[s.source.id]){
            if(s.source.getRotation().x < -45){
                s.source.getComponent("minecraft:equippable").setEquipment("Mainhand", empty_bucket);
                s.source.dimension.playSound("ambient.underwater.exit", s.source.location);
                player_soaked_duration[s.source.id] += 450;
            }
        }
        player_place_water_bucket[s.source.id] = false;
    })
});