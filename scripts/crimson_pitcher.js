import { system } from "@minecraft/server";
import { addThirst } from "./thirst";

system.beforeEvents.startup.subscribe(s => {
    s.blockComponentRegistry.registerCustomComponent("ac:crimson_pitcher", {
        onTick: e =>{
            if(e.block == undefined || e.block.typeId != "ac:crimson_pitcher") return;
            let permutation = e.block.permutation;
            let after_permutation = permutation;
            let has_water = permutation.getState("ac:has_water");
            let lid_open = permutation.getState("ac:open_lid");
            if(has_water){
                if(lid_open < 3) after_permutation = after_permutation.withState("ac:open_lid", lid_open + 1);
            }else{
                if(lid_open > 0){
                    after_permutation = after_permutation.withState("ac:open_lid", lid_open - 1);
                }else{
                    after_permutation = after_permutation.withState("ac:has_water", true);
                }
            }
            e.block.setPermutation(after_permutation);
        },
        onPlayerInteract: e =>{
            let permutation = e.block.permutation;
            let has_water = permutation.getState("ac:has_water");
            let lid_open = permutation.getState("ac:open_lid");
            if(has_water && lid_open >= 2){
                let after_permutation = permutation;
                after_permutation = after_permutation.withState("ac:open_lid", 3);
                after_permutation = after_permutation.withState("ac:has_water", false);
                e.block.setPermutation(after_permutation);

                addThirst(e.player, 6);
            }
        }
    });
});