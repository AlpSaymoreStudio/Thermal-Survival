import { world, system } from "@minecraft/server";

let dimension;
let player_thirst_data = {};
let player_thirst_item_database = {};

system.run(()=>{
    dimension = world.getDimension("minecraft:overworld");
})

system.afterEvents.scriptEventReceive.subscribe(s=>{
    if(s.id == "ac:send_thirst_data"){
        let data = JSON.parse(s.message);
        player_thirst_data[data.target_id] = {
            thirst: data.thirst, 
            thirst_exhaustion: data.thirst_exhaustion
        }
    }else if(s.id == "ac:send_thirst_item_db"){
        let syntax = s.message.split("-D-");
        let data = JSON.parse(syntax[1]);
        player_thirst_item_database[syntax[0]] = data;
    }
}, { namespaces: [ "ac" ]});

export class AdventureCondimentModule{
    static registerTemperatureItem(item, temperature, is_insulation = false){
        system.runTimeout(()=>{
            dimension.runCommand("scriptevent ac:register_api register_temperature " + item + " " + temperature + " " + (is_insulation ? 1 : 0));
        }, 2)
    }

    static registerThirstItem(item, thirst, is_dirty = false){
        system.runTimeout(()=>{
            dimension.runCommand("scriptevent ac:register_api register_thirst " + item + " " + thirst + " " + (is_dirty ? 1 : 0));
        }, 2)
    }

    static getPlayerThirst(player){
        return player_thirst_data[player.id]?.thirst || 20;
    }

    static getPlayerThirstExhaustion(player){
        return player_thirst_data[player.id]?.thirst_exhaustion || 0;
    }

    static getItemThirstData(item){
        if(typeof item === "string"){
        return player_thirst_item_database[item] || undefined;
        }
        return player_thirst_item_database[item.id] || undefined;
    }
}