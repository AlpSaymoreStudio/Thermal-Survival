import { world, system, MolangVariableMap, BlockVolume, ListBlockVolume } from "@minecraft/server";
import { LightSourceData, LightStats, TemperatureAdditionBlockData } from "./database";
import { Vector } from "./Vector3";
import { setUIData } from "./ui_handler";
import { getTemperatureInsulation, getTemperatureResistance } from "./armor";
import { getPlayerSoakedLevel } from "./water_mechanics";

// let LightPermutation = [];
// Object.keys(LightSourceData).forEach(block_id =>{
//     try{
//         LightPermutation.push(BlockPermutation.resolve(block_id));
//     }catch(error){
//         console.warn("[ADVENTURE CONDIMENT] Cannot find block " + block_id);
//     }
// })

function mix(x, y, a){
    return x * ( 1 - a ) + y * a;
}

function smoothstep(edge0, edge1, x){
    let t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0.0), 1.0);
    return t * t * (3.0 - 2.0 * t);
}

let player_block_temperature = {};

let ScanMap = [];
const dist = 16;
for(let x = -dist; x <= dist; x++){
    for(let y = -dist; y <= dist; y++){
        for(let z = -dist; z <= dist; z++){
            let offset = new Vector({ x: x, y: y, z: z });
            let distance = offset.length();
            if(distance > dist) continue;
            ScanMap.push({
                offset: offset,
                distance: distance
            })
        }
    }
}
ScanMap.sort((a, b) =>{
    return a.distance - b.distance
})

var SCAN_CHUNK_MAP_OFFSET = [];

for(let x = -1; x <= 1; x++){
    for(let y = -1; y <= 1; y++){
        for(let z = -1; z <= 1; z++){
            SCAN_CHUNK_MAP_OFFSET.push({ x, y, z })
        }
    }
}

function* findNearlightBlock(dimension, base_location, id) {
    let temp_light = { ... LightSourceData };
    let base_light = player_distance_to_light_temp[id];
    let light = -1;
    for(let offset of ScanMap){
        if(base_light != player_distance_to_light_temp[id]){ 
            light = -1;
            break;
        }
        if(Math.random() < offset.distance / 10){
            continue;
        }else{
            if(Math.random() < 0.15) continue;
        }
        try{
            let location = Vector.round(base_location).add(offset.offset).add(0.5);
            let block = dimension.getBlock(location);
            if(!block.isAir){
                if(temp_light[block.typeId] != undefined){
                    if((temp_light[block.typeId]) > offset.distance){
                        if(LightStats[block.typeId]){
                            if(block.permutation.matches(block.typeId, LightStats[block.typeId])){
                                light = light == -1 ? (location.distance(base_location) / temp_light[block.typeId]) * 16 : Math.min(light, (location.distance(base_location) / temp_light[block.typeId]) * 16);
                                // break;
                            }
                        }else{
                            light = light == -1 ? (location.distance(base_location) / temp_light[block.typeId]) * 16 : Math.min(light, (location.distance(base_location) / temp_light[block.typeId]) * 16);
                            // break;
                        }
                    }else{
                        delete temp_light[block.typeId]
                    }
                }else if(block.getComponent("adventure_condiment:heat_emission")){
                    let emission_distance = Math.max(0, Math.min(16, block.getComponent("adventure_condiment:heat_emission").customComponentParameters.params.distance));
                    let distance = location.distance(base_location);
                    if(distance <= emission_distance){
                        light = light == -1 ? (distance / emission_distance) * 16 : Math.min(light, (distance / emission_distance) * 16);
                        // break;
                    }
                }
                if(block.getComponent("adventure_condiment:temperature")){
                    let emission_distance = Math.max(0, Math.min(16, block.getComponent("adventure_condiment:temperature").customComponentParameters.params.distance));
                    let distance = location.distance(base_location);
                    if(distance <= emission_distance){
                        player_block_temperature[id][Vector.toString(block.location)] = block;
                    }
                }else if(TemperatureAdditionBlockData[block.typeId] != undefined){
                    let emission_distance = Math.max(0, Math.min(16, TemperatureAdditionBlockData[block.typeId].distance));
                    let distance = location.distance(base_location);
                    if(distance <= emission_distance){
                        player_block_temperature[id][Vector.toString(block.location)] = block;
                    }
                }
            }
        }catch(error){
            console.warn("[ADVENTURE CONDIMENT] Error while scanning light block: ", error);
            break;
        }
    }
    
    if(light > -1){
        player_distance_to_light_temp[id] = light;
    }else{
        if(player_distance_to_light_temp[id] < 16) player_distance_to_light_temp[id] += 0.5;
    }
}

let block_light_map_data = {
    "minecraft:overworld": {},
    "minecraft:the_end": {},
    "minecraft:nether": {},
}

system.run(()=>{
    let data = world.getDynamicProperty("block_light_map_data");
    if(data != undefined) block_light_map_data = JSON.parse(data);
})

function refreshChunkLightMap(s){
    let dimension = s.block.dimension;
    let id = Vector.divide(s.block.location, 16).floor().toString();
    if(block_light_map_data[dimension.id][id] != undefined) block_light_map_data[dimension.id][id].next_generate = system.currentTick + 10;
}

world.afterEvents.blockExplode.subscribe(s => refreshChunkLightMap(s));
world.afterEvents.playerBreakBlock.subscribe(s => refreshChunkLightMap(s));
world.afterEvents.playerInteractWithBlock.subscribe(s => refreshChunkLightMap(s));

let exclude_blocks = {}

async function generateChunkLightMap(dimension, chunk){
    let id = Vector.toString(chunk);
    let preload_list = block_light_map_data[dimension.id][id]?.list || [];
    let is_preload = block_light_map_data[dimension.id][id]?.is_preload || false;
    if(block_light_map_data[dimension.id][id] == undefined) block_light_map_data[dimension.id][id] = {
        list: []
    }
    block_light_map_data[dimension.id][id].is_generating = true;
    block_light_map_data[dimension.id][id].is_preload = false;
    block_light_map_data[dimension.id][id].next_generate = system.currentTick + 1200;

    let list = [];
    let chunk_position = Vector.multiply(chunk, 16);

    let excludeTypes = [ "minecraft:air" ];
    Object.keys(exclude_blocks).forEach(key =>{
        if(exclude_blocks[key] > 256) excludeTypes.push(key);
    })
    
    let selected_block_location;
    if(preload_list.length < 128 && is_preload){
        selected_block_location = new ListBlockVolume(preload_list.map(e => e.location)).getBlockLocationIterator();
    }else{
        block_light_map_data[dimension.id][id].is_preload = false;
        selected_block_location = dimension.getBlocks(new BlockVolume(chunk_position, Vector.add(chunk_position, 16)), { excludeTypes }, true).getBlockLocationIterator();
    }
    let iteration_count = 256 / Math.min(10, world.getPlayers().length);
    let iteration = iteration_count;
    for(const block_location of selected_block_location){
        try{
            let block = dimension.getBlock(block_location);
            if(!block?.isAir){
                let has_data = false;
                let data = {
                    typeId: block.typeId,
                    location: block.location,
                    data: {}
                }
                if(LightSourceData[block.typeId] != undefined){
                    if(LightStats[block.typeId]){
                        if(block.permutation.matches(block.typeId, LightStats[block.typeId])){
                            data.data.heat_block_distance = LightSourceData[block.typeId];
                            has_data = true;
                        }
                    }else{
                        data.data.heat_block_distance = LightSourceData[block.typeId];
                        has_data = true;
                    }
                }else if(block.getComponent("adventure_condiment:heat_emission")){
                    data.data.heat_block_distance = Math.max(0, Math.min(16, block.getComponent("adventure_condiment:heat_emission").customComponentParameters.params.distance));
                    has_data = true;
                }

                if(block.getComponent("adventure_condiment:temperature")){
                    let emission_distance = Math.max(0, Math.min(16, block.getComponent("adventure_condiment:temperature").customComponentParameters.params.distance));
                    data.data.temperature_block_distance = emission_distance
                    has_data = true;
                }else if(TemperatureAdditionBlockData[block.typeId] != undefined){
                    let emission_distance = Math.max(0, Math.min(16, TemperatureAdditionBlockData[block.typeId].distance));
                    data.data.temperature_block_distance = emission_distance
                    has_data = true;
                }
                if(has_data){
                    data.block = block;
                    list.push(data);
                    if(exclude_blocks[block.typeId] != undefined) delete exclude_blocks[block.typeId];
                }else{
                    exclude_blocks[block.typeId] = (exclude_blocks[block.typeId] || 0) + 1;
                }
            }
        }catch(error){
            console.warn("[ADVENTURE CONDIMENT] Error while scanning light block: ", error);
            break;
        }

        // let block_location = selected_block_location.next();
        if(iteration == 0){
            iteration = iteration_count;
            await system.waitTicks(1);
        }else{
            iteration--;
        }
    }

    block_light_map_data[dimension.id][id].is_generating = false;
    block_light_map_data[dimension.id][id].is_preload = false;
    block_light_map_data[dimension.id][id].list = list;
}

function getChunkLightMap(dimension, chunk){
    let id = Vector.toString(chunk);
    if(block_light_map_data[dimension.id][id]?.is_preload == true){
        generateChunkLightMap(dimension, chunk);
        return [];
    }else if(block_light_map_data[dimension.id][id]?.is_generating == false && system.currentTick > block_light_map_data[dimension.id][id]?.next_generate){
        generateChunkLightMap(dimension, chunk);
        return block_light_map_data[dimension.id][id].list;
    }else if(block_light_map_data[dimension.id][id] != undefined){
        return block_light_map_data[dimension.id][id].list;
    }else{
        generateChunkLightMap(dimension, chunk);
    }
    return [];
}

let player_heater_power = {};
let player_distance_to_light_temp = {};
let player_distance_to_light = {};

function getNearBlocks(source){
    let dimension = source.dimension;
    // system.runJob(findNearlightBlock(dimension, source.location, source.id))

    if(Vector.getLength(source.getVelocity()) > 0.3) return;
    let chunk = Vector.divide(source.location, 16).floor();
    let light_map = [];
    SCAN_CHUNK_MAP_OFFSET.forEach(offset =>{
        let data = getChunkLightMap(dimension, chunk.clone().add(offset));
        light_map = light_map.concat(data);
    })
    let heat_distance = 99999;
    let count = 0;
    light_map.forEach(light =>{
        if(Math.random() > Math.min(0.85, Math.max(0, count - 16) / 64)){
            let distance = Vector.distance(source.location, light.location);
            if(light.data?.heat_block_distance >= distance){
                heat_distance = Math.min(heat_distance, distance);
            }

            if(distance <= light.data?.temperature_block_distance){
                player_block_temperature[source.id][Vector.toString(light.location)] = light.block;
            }
        }
        count++;
    })

    if(heat_distance != 99999){
        player_distance_to_light_temp[source.id] = heat_distance;
    }else{
        if(player_distance_to_light_temp[source.id] < 16) player_distance_to_light_temp[source.id] += 0.5;
    }
}

const BODY_TEMPERATURE = 36;
let local_temp = {}
let local_random_value = {}
let heater_item_container_index = {};

let player_temperature_immune_duration = {};
let player_temperature_screen_buffer = {};
let player_temperature_effect = {};
let environtment_temperature = {};

let player_temperatue_temporary_modifier = {};
let area_temperatue_temporary_modifier = undefined;

let player_absorb_temp = {}

let player_temperature = {};

export function getPlayerTemperatureEffect(player){
    return player_temperature_effect[player.id];
}
export function getPlayerTemperature(player){
    return local_temp[player.id] || BODY_TEMPERATURE;
}
export function getThermometerTemperature(player){
    return environtment_temperature[player.id] || BODY_TEMPERATURE;
}

system.runInterval(()=>{
    if(area_temperatue_temporary_modifier == undefined) area_temperatue_temporary_modifier = JSON.parse(world.getDynamicProperty("area_temperatue_temporary_modifier") || '{"minecraft:overworld": {}, "minecraft:the_nether": {}, "minecraft:the_end": {}}');

    let sun_intensity = Math.sin((world.getTimeOfDay() / 12000)* Math.PI);
    for(let playerData of world.getPlayers()){
        if(local_temp[playerData.id] == undefined){
            local_temp[playerData.id] = BODY_TEMPERATURE;
            player_temperature[playerData.id] = BODY_TEMPERATURE;
            player_distance_to_light_temp[playerData.id] = 16;
            player_distance_to_light[playerData.id] = 16;
            local_random_value[playerData.id] = Math.round(Math.random() * 20);
            player_temperature_effect[playerData.id] = 0;

            player_absorb_temp[playerData.id] = playerData.getDynamicProperty("absorb_temperature") || BODY_TEMPERATURE;
            player_temperature_immune_duration[playerData.id] = playerData.getDynamicProperty("player_temperature_immune_duration") || 0;
            player_temperatue_temporary_modifier[playerData.id] = JSON.parse(playerData.getDynamicProperty("player_temperatue_temporary_modifier") || '{}');
            player_block_temperature[playerData.id] = {};
        }

        let is_immune = playerData.getGameMode() == "Creative" || playerData.getGameMode() == "Spectator" || player_temperature_immune_duration[playerData.id] > system.currentTick;

        player_distance_to_light[playerData.id] = mix(player_distance_to_light[playerData.id], player_distance_to_light_temp[playerData.id], 0.05)

        let local_intensity = playerData.dimension.id == "minecraft:overworld" ? sun_intensity : (playerData.dimension.id == "minecraft:the_end" ? -1 : 1);

        try{
            let entity = playerData.dimension.spawnEntity("ac:temperature_checker", Vector.add(playerData.location, {x: (Math.random() * 16) - 8, y: (Math.random() * 4), z: (Math.random() * 16) - 8}));
            let light_distance = smoothstep(15, 1, player_distance_to_light[playerData.id]);
            let is_underground = entity.getProperty("ac:is_underground");
            if(is_underground){
                if(Vector.distance(playerData.location, entity.location) < 4){
                    is_underground = playerData.dimension.getBlockFromRay(entity.location, { x: 0, y: 1, z: 0}, { maxDistance: 4 }) != undefined;
                }else{
                    is_underground = false;
                }
            }

            let temperature = (entity.getProperty("ac:temperature") / 200 + 0.5) * (0.9 + local_intensity * 0.2 ) * (is_underground && playerData.dimension.id != "minecraft:nether" ? 0.4 : 1.0) * 60 - 20;
            if(temperature > 60 && playerData.dimension.id == "minecraft:overworld") temperature = 60;

            if(entity.getProperty("ac:in_water_or_rain")) temperature -= 15;

            if(playerData.location.y > 98 && !is_underground){
                temperature -= (playerData.location.y - 98) / 10;
            }
            
            temperature = Math.max(temperature, light_distance * 54 - 20);

            Object.keys(player_block_temperature[playerData.id]).forEach(key =>{
                let block = player_block_temperature[playerData.id][key];
                if(block == undefined || block.dimension.id != playerData.dimension.id){
                    delete player_block_temperature[playerData.id][key];
                    return;
                }
                let block_temp = block.getComponent("adventure_condiment:temperature");
                if(block_temp){
                    let distance = Vector.distance(playerData.location, block.location);
                    if(distance <= block_temp.customComponentParameters.params.distance){
                        temperature += block_temp.customComponentParameters.params.temperature * (1 - distance / block_temp.customComponentParameters.params.distance);
                    }else{
                        delete player_block_temperature[playerData.id][key];
                        return;
                    }
                }else if(TemperatureAdditionBlockData[block.typeId] != undefined){
                    let distance = Vector.distance(playerData.location, block.location);
                    if(distance <= TemperatureAdditionBlockData[block.typeId].distance){
                        temperature += TemperatureAdditionBlockData[block.typeId].temperature * (1 - distance / TemperatureAdditionBlockData[block.typeId].distance);
                    }else{
                        delete player_block_temperature[playerData.id][key];
                        return;
                    }
                }else{
                    delete player_block_temperature[playerData.id][key];
                    return;
                }
            });

            Object.keys(area_temperatue_temporary_modifier[playerData.dimension.id]).forEach(keys => {
                let data = area_temperatue_temporary_modifier[playerData.dimension.id][keys];
                let distance = Vector.distance(playerData.location, data.location);
                if(distance <= data.radius){
                    temperature += data.temperature * (1 - distance / data.radius);
                }
            })

            environtment_temperature[playerData.id] = temperature;

            if(getPlayerSoakedLevel(playerData) > 0){
                temperature -= 10;
            }
            if(playerData.hasComponent("minecraft:onfire")){
                temperature += 30;
            }else if(playerData.dimension.getBlock(playerData.location)?.typeId == "minecraft:powder_snow"){
                temperature -= 30;
            }

            //temporary_temperature
            let temeprature_temp_keys = Object.keys(player_temperatue_temporary_modifier[playerData.id]);
            temeprature_temp_keys.forEach(key =>{
                temperature += player_temperatue_temporary_modifier[playerData.id][key];
            })

            player_temperature[playerData.id] = mix(player_temperature[playerData.id], temperature, 0.005);
            // console.warn(Math.round(player_temperature[playerData.id]))
            
            if(player_heater_power[playerData.id] > 0 && local_temp[playerData.id] < 28){
                player_absorb_temp[playerData.id] += 0.3;
                // console.warn("aa")
            }

            if(is_immune){
                player_absorb_temp[playerData.id] = BODY_TEMPERATURE;
                local_temp[playerData.id] = BODY_TEMPERATURE;
            }else{
                player_absorb_temp[playerData.id] = mix(player_absorb_temp[playerData.id], temperature, Math.pow(0.1, Math.max(1, 2 + (getTemperatureInsulation(playerData) / 2) - getPlayerSoakedLevel(playerData))));
                local_temp[playerData.id] = mix(player_absorb_temp[playerData.id], BODY_TEMPERATURE, 0.1);
            }

            // if(local_temp[playerData.id] <= 14){
            //     if(player_heater_slot_inventory[playerData.id][0]){
            //         let item = player_heater_slot_inventory[playerData.id][0].getItem();
            //         item.getComponent("minecraft:durability").damage += 1;
            //         local_temp[playerData.id] += 20;
            //         player_heater_slot_inventory[playerData.id][0].setItem(item);
            //     }
            // }

            // console.warn(player_absorb_temp[playerData.id], local_temp[playerData.id]);
            playerData.setDynamicProperty("absorb_temperature", player_absorb_temp[playerData.id]);

            if(system.currentTick % 4 == Math.round(local_random_value[playerData.id] / 5)) getNearBlocks(playerData)
                
            let temprary_heat_resistance = 48;
            let temprary_cold_resistance = 14;

            let temperature_resistance = getTemperatureResistance(playerData);
            if(temperature_resistance > 0){
                temprary_heat_resistance += temperature_resistance * 1.25;
            }else{
                temprary_cold_resistance += temperature_resistance;
            }
        
            // console.warn("ENV TEMP", (temperature))
            // console.warn("LOCAL TEMP", local_temp[playerData.id])
            // console.warn("BODY TEMP ADD", (local_temp[playerData.id] - BODY_TEMPERATURE))
            // console.warn("BODY TEMP", player_temperature[playerData.id])
            entity.remove();

            let health = playerData.getComponent("minecraft:health");

            if(is_immune){
                player_temperature_effect[playerData.id] = 0;
            }else{
                if(system.currentTick % 41 == Math.round(local_random_value[playerData.id]*2) && player_temperature_effect[playerData.id] != 0){
                    if(local_temp[playerData.id] > temprary_heat_resistance && player_temperature_effect[playerData.id] < 0){
                        player_temperature_effect[playerData.id] += 1;
                    }else if(local_temp[playerData.id] < temprary_cold_resistance && player_temperature_effect[playerData.id] > 0){
                        player_temperature_effect[playerData.id] -= 1;
                    }
                }

                if(system.currentTick % (101 + getTemperatureInsulation(playerData) * 20 - getPlayerSoakedLevel(playerData) * 20) == Math.round(local_random_value[playerData.id]*(5 + getTemperatureInsulation(playerData) - getPlayerSoakedLevel(playerData)))){
                // if(system.currentTick % 20 == Math.round(local_random_value[playerData.id]*1)){
                    if(local_temp[playerData.id] > temprary_heat_resistance){
                        if(player_temperature_effect[playerData.id] < 15 * smoothstep(temprary_heat_resistance, temprary_heat_resistance + 20, local_temp[playerData.id])){
                            player_temperature_effect[playerData.id] += 1;
                        }else{
                            if(player_temperature_effect[playerData.id] > 0) player_temperature_effect[playerData.id] -= 1;
                        }
                    }else if(local_temp[playerData.id] < temprary_cold_resistance){
                        if(player_temperature_effect[playerData.id] > -15 * smoothstep(temprary_cold_resistance, temprary_cold_resistance-20, local_temp[playerData.id])){
                            player_temperature_effect[playerData.id] -= 1;
                        }else{
                            if(player_temperature_effect[playerData.id] < 0) player_temperature_effect[playerData.id] += 1;
                        }
                    }else{
                        if(player_temperature_effect[playerData.id] != 0) player_temperature_effect[playerData.id] += player_temperature_effect[playerData.id] > 0 ? -1 : 1;
                    }
                }
                // console.warn("view temp", Math.round((player_temperature[playerData.id] / 2) + 10))
                // console.warn("view effect", player_temperature_effect[playerData.id])

                if(player_temperature_effect[playerData.id] > 0){
                    if((health.currentValue > health.effectiveMax - Math.max(0, player_temperature_effect[playerData.id] - 1) || (player_temperature_effect[playerData.id] > 10 && system.currentTick % 61 == Math.round(local_random_value[playerData.id] * 3))) && getPlayerSoakedLevel(playerData) == 0) playerData.applyDamage(1, {cause: "fire"});
                }else if(player_temperature_effect[playerData.id] < 0){
                    let health = playerData.getComponent("minecraft:health");
                    if(Math.round(health.currentValue) <= Math.min(9, -player_temperature_effect[playerData.id] - 2)){
                        playerData.applyDamage(999, {cause: "freezing"});
                    }
                    if(player_temperature_effect[playerData.id] < -9 && system.currentTick % 61 == Math.round(local_random_value[playerData.id] * 3)){
                        playerData.applyDamage(1, {cause: "freezing"});
                    }
                    if(player_temperature_effect[playerData.id] < -1){
                        playerData.addEffect("slowness", 80, { showParticles: false, amplifier: Math.floor((-player_temperature_effect[playerData.id] - 1) / 6 )});
                    }
                    if(player_temperature_effect[playerData.id] < -1 && system.currentTick % 61 == Math.round(local_random_value[playerData.id] * 3)){
                        playerData.runCommand("camerashake add @s 0.05 0.5 rotational");
                        let duration = 5;
                        let run_id = system.runInterval(()=>{
                            if(duration <= 0){
                                system.clearRun(run_id);
                            }
                            let view_dir = playerData.getViewDirection();
                            let breath_direction = new MolangVariableMap();
                            breath_direction.setVector3("variable.direction", view_dir);
                            let head_loc = playerData.getHeadLocation();

                            head_loc.x += view_dir.x * 0.3;
                            head_loc.y += view_dir.y * 0.3;
                            head_loc.z += view_dir.z * 0.3;

                            playerData.dimension.spawnParticle("ac:cold_breath", head_loc, breath_direction);
                            duration--;
                        }, 2);
                    }
                }
            }
            setUIData(playerData, "frozen_heart", Math.max(0, Math.min(9, -player_temperature_effect[playerData.id]-2)));

            let burnt_heart = Math.max(0, player_temperature_effect[playerData.id] - 1);
            let x_heart = (10 - Math.ceil((health.effectiveMax % 20) / 2)) % 10;
            // console.warn(Math.max(0, Math.ceil(health.effectiveMax / 20) - 2))

            setUIData(playerData, "burnt_heart", Math.min((10 - x_heart) * 2, burnt_heart));
            setUIData(playerData, "x_heart", x_heart);
            setUIData(playerData, "y_heart", Math.max(0, Math.ceil(health.effectiveMax / 20)));
            setUIData(playerData, "second_burnt_heart", Math.max(0, burnt_heart - (10 - x_heart) * 2));
            
            // let promp = data.thirst_bar.toString().padStart(2, '0') + data.thirst_effect + '' + parseInt(data.temperature_display / 10) + '' + data.temperature_bar.toString().padStart(2, '0') + data.temperature_display.toString().padStart(2, '0') + (configuration.getValue("ac:thirst") ? 1 : 0) + "" + (configuration.getValue("ac:temperature") ? 1 : 0);
            let temperature_effect = 50; //suppose to be 0 - 99
            if(local_temp[playerData.id] < BODY_TEMPERATURE - 10){
                let add = 0;
                if(temperature_resistance < 0) add += temperature_resistance;
                let max_add = 0;
                if(player_temperature_effect[playerData.id] < 0) max_add += player_temperature_effect[playerData.id] * 3;
                temperature_effect = smoothstep(temprary_cold_resistance - 20, temprary_cold_resistance + 5, local_temp[playerData.id] + max_add - add)*50;
            }else if(local_temp[playerData.id] > BODY_TEMPERATURE + 10){
                let add = 0;
                if(temperature_resistance > 0) add += temperature_resistance;
                let max_add = 0;
                if(player_temperature_effect[playerData.id] > 0) max_add += player_temperature_effect[playerData.id] * 3;
                temperature_effect = smoothstep(temprary_heat_resistance - 5, temprary_heat_resistance + 20, local_temp[playerData.id] + max_add - add)*49+50;
            }

            if(player_temperature_screen_buffer[playerData.id] == undefined){
                player_temperature_screen_buffer[playerData.id] = temperature_effect;
            }else{
                player_temperature_screen_buffer[playerData.id] = mix(temperature_effect, player_temperature_screen_buffer[playerData.id], 0.99);
            }

            setUIData(playerData, "temperature_effect", Math.round(player_temperature_screen_buffer[playerData.id]))
            // setUIData(playerData, "temperature_effect", Math.round(player_temperature_screen_buffer[playerData.id] * 0.8 + 10))
            // console.warn(player_temperature_screen_buffer[playerData.id])

            // playerData.runCommand(`scriptevent ui_load:ac_hud_data_update a0001${.toString().padStart(2, '0')}${temperature_effect}11ac_hud_data_update`);
            
            if(is_immune){
                setUIData(playerData, "temperature_bar", 21);
            }else{
                let temperature_ui = smoothstep(-10, 60, local_temp[playerData.id]);
                setUIData(playerData, "temperature_bar", Math.round(mix(10, temperature_ui * 20, Math.abs(2 * (temperature_ui - 0.5)))));
            }
            // console.warn(player_temperature_effect[playerData.id], player_heater_power[playerData.id], local_temp[playerData.id], player_absorb_temp[playerData.id], player_temperature_screen_buffer[playerData.id])
            // console.warn(temprary_cold_resistance, temprary_heat_resistance)
        }catch(error){
            console.warn("[AdventureCondiment]", error)
        }
    }
});

world.afterEvents.playerSpawn.subscribe(s=>{
    if(s.initialSpawn && s.player.getDynamicProperty("player_temperature_immune_duration") != undefined) return;
    player_temperature_effect[s.player.id] = 0;
    player_heater_power[s.player.id] = 0;
    player_absorb_temp[s.player.id] = BODY_TEMPERATURE;
    player_temperature_screen_buffer[s.player.id] = 50;
    player_temperature_immune_duration[s.player.id] = system.currentTick + (180 * 20);
    s.player.setDynamicProperty("player_temperature_immune_duration", player_temperature_immune_duration[s.player.id]);
});

world.afterEvents.entityDie.subscribe(s=>{
    player_temperature_effect[s.deadEntity.id] = 0;
    player_heater_power[s.deadEntity.id] = 0;
    player_absorb_temp[s.deadEntity.id] = BODY_TEMPERATURE;
    player_temperature_screen_buffer[s.deadEntity.id] = 50;
    player_block_temperature[s.deadEntity.id] = {};
    player_temperatue_temporary_modifier[s.deadEntity.id] = {};    
}, { entityTypes: [ "minecraft:player" ]});

system.runInterval(()=>{
    world.getPlayers().forEach(playerData =>{
        if(player_heater_power[playerData.id] == undefined) player_heater_power[playerData.id] = 0;
        let inventory = playerData.getComponent("minecraft:inventory");
        let container = inventory.container;
        let size = inventory.inventorySize;

        if(local_temp[playerData.id] < 24){
            for(let i = 0; i < size / (size / 4); i++){
                let index = i + ((system.currentTick % (size / 4)) * 4);
                let item = container.getItem(index);
                if(item){
                    let tags = item.getTags();
                    if(tags.includes("is_heater") && item.hasComponent("minecraft:durability")){
                        let durability = item.getComponent("minecraft:durability");
                        if(durability.damage < durability.maxDurability){
                            heater_item_container_index[playerData.id] = container.getSlot(index);
                            break;
                        }
                    }
                }
            }
            if(system.currentTick % 40 == Math.round(local_random_value[playerData.id] * 2) && heater_item_container_index[playerData.id]?.isValid){
                let item = heater_item_container_index[playerData.id].getItem();
                if(item != undefined && item.getTags().includes("is_heater") && item.hasComponent("minecraft:durability")){
                    let durability = item.getComponent("minecraft:durability");
                    if(durability.damage < durability.maxDurability){
                        item.getComponent("minecraft:durability").damage += 1;
                        player_heater_power[playerData.id] += 1.01;
                        heater_item_container_index[playerData.id].setItem(item);
                    }
                }
            }
        }else{
            if(heater_item_container_index[playerData.id] != undefined) delete heater_item_container_index[playerData.id];
        }
        
        player_heater_power[playerData.id] = Math.max(0, player_heater_power[playerData.id] - 0.01);

    })
})

world.beforeEvents.playerLeave.subscribe(s =>{
    s.player.setDynamicProperty("player_temperatue_temporary_modifier", JSON.stringify(player_temperatue_temporary_modifier[s.player.id]));
})
system.beforeEvents.shutdown.subscribe(s =>{
    for(let playerData of world.getPlayers()){
        playerData.setDynamicProperty("player_temperatue_temporary_modifier", JSON.stringify(player_temperatue_temporary_modifier[playerData.id]));
    }
    world.setDynamicProperty("area_temperatue_temporary_modifier", JSON.stringify(area_temperatue_temporary_modifier));

    Object.keys(block_light_map_data).forEach(dimension =>{
        let list = Object.keys(block_light_map_data[dimension]).sort((a, b) => block_light_map_data[dimension][b]?.next_generate - block_light_map_data[dimension][a]?.next_generate).splice(0, 128);
        let data = {};
        list.forEach(list => {
            data[list] = block_light_map_data[dimension][list];
            data[list].is_preload = true;
            data[list].list = block_light_map_data[dimension][list].list.map(e => { return {location: e.location}});
        })
        block_light_map_data[dimension] = data;
    })
    world.setDynamicProperty("block_light_map_data", JSON.stringify(block_light_map_data));
})

export function handleTemperatureCommand(e, target, param, identifier, value){
    if(param == "add" && value == undefined){
        return {
            message: `You need define value to add temperature modifier`,
            status: 1
        }
    }

    for(let player of target){
        if(param == "add"){
            player_temperatue_temporary_modifier[player.id][identifier] = value;
        }else if(param == "remove"){
            delete player_temperatue_temporary_modifier[player.id][identifier];
        }
    }
    
    return {
        message: `Applied ${param} temperature to ${target.map(t => t.name).join(", ")}`,
        status: 0
    }
}

export function handleTemperatureAreaCommand(e, param, identifier, location, radius, value){
    if(param == "add" && location == undefined){
        return {
            message: `You need define location to add temperature modifier`,
            status: 1
        }
    }
    if(param == "add" && radius == undefined){
        return {
            message: `You need define radius to add temperature modifier`,
            status: 1
        }
    }
    if(param == "add" && value == undefined){
        return {
            message: `You need define value to add temperature modifier`,
            status: 1
        }
    }

    if(radius <= 0){
        return {
            message: `Radius must be more than 0`,
            status: 1
        }
    }

    let dimension = e.sourceEntity?.dimension;
    if(dimension){
        if(param == "add"){
            area_temperatue_temporary_modifier[dimension.id][identifier] = {
                radius,
                temperature: value,
                location
            }
        }else if(param == "remove"){
            delete area_temperatue_temporary_modifier[dimension.id][identifier];
        }
    }

    return {
        message: `Applied ${param} temperature`,
        status: 0
    }
}

export function handleTemperatureImmuneEffect(e, target, param, effect, seconds){
    for(let player of target){
        if(param == "set"){
            player_temperature_immune_duration[player.id] = system.currentTick + seconds * 20;
            player.setDynamicProperty("player_temperature_immune_duration", player_temperature_immune_duration[player.id]);

            return {
                message: `Applied temperature immune effect to ${target.map(t => t.name).join(", ")}`,
                status: 0
            }
        }else if(param == "clear"){
            player_temperature_immune_duration[player.id] = system.currentTick -1;
            player.setDynamicProperty("player_temperature_immune_duration", player_temperature_immune_duration[player.id]);

            return {
                message: `Cleared temperature immune effect to ${target.map(t => t.name).join(", ")}`,
                status: 0
            }
        }
    }
}