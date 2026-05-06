import { world, system, ItemStack, ItemTypes, BlockPermutation } from "@minecraft/server";
import { handleTemperatureCommand } from "./temperature";

let drink_effect = {};

system.run(() =>{
    drink_effect = JSON.parse(world.getDynamicProperty("drink_effect") || "{}");
})

export function drinkHandler(input, param){
    drink_effect[input.source.id][input.itemStack.typeId] = {
        end_duration: system.currentTick + param.params.duration,
        temperature: param.params.temperature,
        id: "effect:" + input.itemStack.typeId
    };
    handleTemperatureCommand(undefined, [ input.source ], "add", "effect:" + input.itemStack.typeId, param.params.temperature);
}

system.beforeEvents.shutdown.subscribe(s =>{
    world.setDynamicProperty("drink_effect", JSON.stringify(drink_effect));
})

system.runInterval(() =>{
    world.getPlayers().forEach(playerData => {
        if(drink_effect[playerData.id] == undefined) drink_effect[playerData.id] = {};

        Object.keys(drink_effect[playerData.id]).forEach(key =>{
            let data = drink_effect[playerData.id][key];
            if(system.currentTick > data.end_duration){
                handleTemperatureCommand(undefined, [ playerData ], "remove", data.id);
                delete drink_effect[playerData.id][key];
            }
        });
    });
})

world.afterEvents.itemCompleteUse.subscribe(s=>{
    if(s.itemStack.typeId == "minecraft:milk_bucket"){
        Object.keys(drink_effect[s.source.id]).forEach(key =>{
            let data = drink_effect[s.source.id][key];
            handleTemperatureCommand(undefined, [ s.source ], "remove", data.id);
            delete drink_effect[s.source.id][key];
        });
    }
})