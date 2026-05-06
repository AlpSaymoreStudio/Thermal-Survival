import { world, system, ItemStack, ItemTypes, BlockPermutation } from "@minecraft/server";
import { Vector } from "./Vector3";

let start_tick = system.currentTick;

let rangefinder_using_distance = {}
let rangefinder_start_rotation = {}
let rangefinder_start_location = {}
let rangefinder_start_anchor_location = {}
let start_item_duration = {}
let start_item_tick = {}
let ping_duration = {}

function getRelativeBlockLocation(ray){
	let location = Vector.add(ray.block.location, ray.faceLocation);
	if(ray.face == "Up" && ray.faceLocation.y == 0){
		location.y += 1;
	}else if(ray.face == "East" && ray.faceLocation.x == 0){
		location.x += 1;
	}else if(ray.face == "South" && ray.faceLocation.z == 0){
		location.z += 1;
	}
	return location;
}

function setLocationRounding(location){
    Object.keys(location).forEach(key => {
        let loc = Math.floor(location[key]);
        let loc_fract = location[key] - loc;
        if(loc_fract > 0.25 && loc_fract < 0.75){
            loc += 0.5;
        }else{
            loc += Math.round(loc_fract);
        }
        location[key] = loc;
    })
    return location;
}

world.afterEvents.itemStartUse.subscribe(s => {
    if(s.itemStack.typeId != "ac:rangefinder") return;
    start_item_duration[s.source.id] = s.useDuration;
    start_item_tick[s.source.id] = system.currentTick;
    rangefinder_start_rotation[s.source.id] = s.source.getViewDirection();
    rangefinder_start_anchor_location[s.source.id] = s.source.location;

    let distance = 54;
    let block_ray = s.source.getBlockFromViewDirection({ maxDistance: 54, includePassableBlocks: true, includeLiquidBlocks: false});
    if(block_ray){
        distance = Vector.distance(s.source.getHeadLocation(), getRelativeBlockLocation(block_ray));
    }
    let target = Vector.multiply(s.source.getViewDirection(), distance).add(s.source.getHeadLocation());
    rangefinder_start_location[s.source.id] = setLocationRounding(target);
})

world.afterEvents.itemStopUse.subscribe(s => {
    if(ping_duration[s.source.id] == undefined) ping_duration[s.source.id] = 0;
    if(ping_duration[s.source.id] < system.currentTick && s.itemStack.typeId == "ac:rangefinder" && start_item_duration[s.source.id] - s.useDuration <= 5 && rangefinder_start_rotation[s.source.id] != undefined && Vector.distance(rangefinder_start_rotation[s.source.id], s.source.getViewDirection()) <= 0.05){
        let distance = 54;
        let block_ray = s.source.getBlockFromViewDirection({ maxDistance: 54, includePassableBlocks: true, includeLiquidBlocks: false});
        if(block_ray){
            distance = Vector.distance(s.source.getHeadLocation(), getRelativeBlockLocation(block_ray));
        }
        let target = Vector.multiply(s.source.getViewDirection(), distance).add(s.source.getHeadLocation());

        let entity = s.source.dimension.spawnEntity("ac:rangefinder_ping", target);
        entity.setDynamicProperty("location_target", target);

        ping_duration[s.source.id] = system.currentTick + 6;
        s.source.playSound("note.bell", { pitch: 2, volume: 0.2});
        s.source.playSound("place.amethyst_cluster", { pitch: 2, volume: 0.2});
        s.source.playSound("block.itemframe.add_item", { pitch: 1.6, volume: 0.3});
    }

    if(rangefinder_using_distance[s.source.id]){
        rangefinder_using_distance[s.source.id] = false;
        s.source.playSound("item.spyglass.stop_using");
    }
    delete rangefinder_start_rotation[s.source.id];
})

function handleRangefinderDistanceHandler(start, player){
    let distance = 54;
    let block_ray = player.getBlockFromViewDirection({ maxDistance: 54, includePassableBlocks: true, includeLiquidBlocks: false});
    if(block_ray){
        distance = Vector.distance(player.getHeadLocation(), getRelativeBlockLocation(block_ray));
    }
    let target = Vector.multiply(player.getViewDirection(), distance).add(player.getHeadLocation());
    target = setLocationRounding(target);

    target.y += 1;
    let target_entity = player.dimension.spawnEntity("ac:rangefinder_distance", target);
    target.y -= 1;
    target_entity.setDynamicProperty("start_tick", start_tick);
    player.setPropertyOverrideForEntity(target_entity, "ac:show", true);

    let tick = 2;
    let run_id = system.runInterval(() =>{
        target_entity.setProperty("ac:animation", (system.currentTick % 40) / 40);
        if(tick <= 0){
            player.removePropertyOverrideForEntity(target_entity, "ac:show");
            target_entity.remove();
            system.clearRun(run_id);
        }
        tick--;
    });

    let direction = Vector.subtract(target, start).normalize();
    let block_distance = Vector.distance(target, start);
    target_entity.setProperty("ac:direction_x", -direction.x);
    target_entity.setProperty("ac:direction_y", -direction.y);
    target_entity.setProperty("ac:direction_z", -direction.z);
    target_entity.setProperty("ac:distance", block_distance < 0.5 ? 0 : block_distance);
    target_entity.setProperty("ac:animation", (system.currentTick % 40) / 40);


    player.onScreenDisplay.setActionBar((Math.floor(block_distance * 2) / 2) + " blocks");
}

system.runInterval(() =>{
    world.getPlayers().forEach(playerData => {
        playerData.dimension.getEntities({type: "ac:rangefinder_distance" }).forEach(entity => {
            if(entity.getDynamicProperty("start_tick") != start_tick){
                entity.remove();
            }
        });

        playerData.dimension.getEntities({type: "ac:rangefinder_ping" }).forEach(entity => {
            entity.teleport(entity.getDynamicProperty("location_target"))
        });

        if(rangefinder_using_distance[playerData.id]){
            handleRangefinderDistanceHandler(rangefinder_start_location[playerData.id], playerData);
        }else{
            if(rangefinder_start_rotation[playerData.id] && system.currentTick - start_item_tick[playerData.id] > 5){
                if(Vector.distance(rangefinder_start_rotation[playerData.id], playerData.getViewDirection()) > 0.1 || Vector.distance(rangefinder_start_anchor_location[playerData.id], playerData.location) > 0.5){
                    let distance = 54;
                    let block_ray = playerData.getBlockFromViewDirection({ maxDistance: 54, includePassableBlocks: true, includeLiquidBlocks: false});
                    if(block_ray){
                        distance = Vector.distance(playerData.getHeadLocation(), getRelativeBlockLocation(block_ray));
                    }

                    rangefinder_using_distance[playerData.id] = true;
                    delete rangefinder_start_rotation[playerData.id];
                    playerData.playSound("item.spyglass.use");
                }
            }
        }
    });
})