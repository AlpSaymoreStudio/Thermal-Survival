import { world, system, ItemStack } from "@minecraft/server";
import { Vector } from "./Vector3";

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let player_refill_bottle = {}
const AcceptableWaterContainer = ["minecraft:potion", "ac:water_flask"];

world.afterEvents.playerInteractWithBlock.subscribe(s=>{
    if(s.block.isLiquid && ["minecraft:glass_bottle", "ac:water_flask"].includes(s.beforeItemStack?.typeId)){
        player_refill_bottle[s.player] = system.currentTick;
    }
})

world.afterEvents.playerInventoryItemChange.subscribe(s=>{
    if(player_refill_bottle[s.player] != system.currentTick) return;
    let inventory = s.player.getComponent("minecraft:inventory").container;
    let item = s.itemStack;
    let lores = item.getLore();

    if(!lores.includes("§7§3§r§2Dirty§2")){
        lores.unshift("§7§3§r§2Dirty§2");
        item.setLore(lores);

        inventory.setItem(s.slot, item);
    }
}, { includeItems: AcceptableWaterContainer});

// world.afterEvents.playerInventoryItemChange.subscribe(s=>{
//     let container_id = s.itemStack.getDynamicProperty("water_container_id");
//     if(container_id == undefined){
//         let item = s.itemStack;
//         let lores = item.getLore();
//         if(!lores.includes("§7§3§r§2Dirty§2")){
//             lores.unshift("§7§3§r§2Dirty§2");
//             item.setLore(lores);
//         }
//         item.setDynamicProperty("water_container_id", generateUUID());
//         let inventory = s.player.getComponent("minecraft:inventory").container;
//         inventory.setItem(s.slot, item);
//     }
// }, { includeItems: [ "ac:water_flask" ]});

world.beforeEvents.playerInteractWithBlock.subscribe(s=>{
    if(s.itemStack?.typeId == "ac:water_flask"){
        if(s.block.typeId == "minecraft:campfire" || s.block.typeId == "minecraft:soul_campfire"){
            if(s.block.permutation.getState("extinguished") == false){
                let is_dirty = s.itemStack.getLore().includes("§7§3§r§2Dirty§2");
                if(!is_dirty){
                    s.cancel = true;
                    return;
                }else{
                    let durability = s.itemStack.getComponent("minecraft:durability");
                    if(durability.damage > 0){
                        s.cancel = true;
                        return;
                    }
                }
            }
        }
    }
})

const FurnaceBlockId = ["minecraft:furnace", "minecraft:smoker", "minecraft:lit_furnace", "minecraft:lit_smoker"];
world.afterEvents.playerInteractWithBlock.subscribe(s =>{
    if(FurnaceBlockId.includes(s.block.typeId)){
        let inventory = s.block.getComponent("minecraft:inventory").container;
        let block_id = s.block.typeId;
        
        system.runTimeout(()=>{
            if(!s.player.isValid) return;
            let view = s.player.getViewDirection();
            let runId = system.runInterval(()=>{
                if(!s.player.isValid || s.block.isAir){
                    system.clearRun(runId);
                    console.warn("stop 1")
                    return;
                }
                let input = s.player.inputInfo.getMovementVector();
                if(input.x != 0 || input.y != 0 || Vector.distance(view, s.player.getViewDirection()) > 0.0){
                    system.clearRun(runId);
                    console.warn("stop 2")
                    return;
                }

                let item = inventory.getItem(0);
                if(item?.typeId == "ac:water_flask"){
                    let is_dirty = item.getLore().includes("§7§3§r§2Dirty§2");
                    if(is_dirty){
                        let durability = s.itemStack.getComponent("minecraft:durability");
                        if(durability == undefined || durability.damage > 0){
                            s.player.dimension.spawnItem(item, s.player.location);
                            inventory.setItem(0);
                        }
                    }else{
                        s.player.dimension.spawnItem(item, s.player.location);
                        inventory.setItem(0);
                    }
                }
            })
        }, 3)
    }
})


