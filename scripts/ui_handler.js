import { world, system } from "@minecraft/server";

let data = {};
export function setUIData(player, identifier, value){
    if(data[player.id] == undefined){
        data[player.id] = {}
    }
    data[player.id][identifier] = value;
}
system.runInterval(()=>{
    for(let playerData of world.getPlayers()){
        if(data[playerData.id] == undefined){
            data[playerData.id] = {
                temperature_bar: 10,
                thirst_bar: 20,
                thirst_effect: 0,
                temperature_effect: 50,
                thirst_effect_display: 0,
                frozen_heart: 0,
                burnt_heart: 0,
                second_burnt_heart: 0,
                soaked: 0,
                infected: 0,
                use_diving_helmet: 0,
                capacity_diving_helmet: 0,
                cold_resistance: 0,
                heat_resistance: 0,
                y_heart: 0,
                x_heart: 0,
                thermometer_status: 0,
                thermometer_counter: 0
            }
        }
        
// playerData.runCommand(`scriptevent ui_load:ac_hud_data_update a${data[playerData.id].thirst_bar.toString().padStart(2, '0')}${data[playerData.id].thirst_effect}1${data[playerData.id].temperature_bar.toString().padStart(2, '0')}${data[playerData.id].temperature_effect.toString().padStart(2, '0')}11ac_hud_data_update`);
// playerData.runCommand("scriptevent ui_load:ac_hud_modifier_data_update a" + data[playerData.id].frozen_heart + data[playerData.id].heat_resistance.toString().padStart(2, '0') + data[playerData.id].cold_resistance.toString().padStart(2, '0') + data[playerData.id].soaked + data[playerData.id].infected.toString().padStart(2, '0') + "ac_hud_modifier_data_update");
// playerData.runCommand("scriptevent ui_load:ac_hud_second_modifier_data_update a" + data[playerData.id].burnt_heart.toString().padStart(2, '0') + data[playerData.id].second_burnt_heart.toString().padStart(2, '0') + data[playerData.id].y_heart.toString().padStart(2, '0') + data[playerData.id].x_heart.toString() + data[playerData.id].thirst_effect_display.toString().padStart(2, '0') + "ac_hud_second_modifier_data_update");
// playerData.runCommand("scriptevent ui_load:ac_hud_item_data_update a" + data[playerData.id].use_diving_helmet + data[playerData.id].capacity_diving_helmet.toString().padStart(2, '0') + data[playerData.id].thermometer_status + data[playerData.id].thermometer_counter.toString().padStart(2, '0') + "ac_hud_item_data_update");

        playerData.runCommand("scriptevent ui_load:ac_all_packed_hud " + 
            `a${data[playerData.id].thirst_bar.toString().padStart(2, '0')}${data[playerData.id].thirst_effect}1${data[playerData.id].temperature_bar.toString().padStart(2, '0')}${data[playerData.id].temperature_effect.toString().padStart(2, '0')}11` + 
            "b" + data[playerData.id].frozen_heart + data[playerData.id].heat_resistance.toString().padStart(2, '0') + data[playerData.id].cold_resistance.toString().padStart(2, '0') + data[playerData.id].soaked + data[playerData.id].infected.toString().padStart(2, '0') + 
            "c" + data[playerData.id].burnt_heart.toString().padStart(2, '0') + data[playerData.id].second_burnt_heart.toString().padStart(2, '0') + data[playerData.id].y_heart.toString().padStart(2, '0') + data[playerData.id].x_heart.toString() + data[playerData.id].thirst_effect_display.toString().padStart(2, '0') + 
            "d" + data[playerData.id].use_diving_helmet + data[playerData.id].capacity_diving_helmet.toString().padStart(2, '0') + data[playerData.id].thermometer_status + data[playerData.id].thermometer_counter.toString().padStart(2, '0') + 
            "ac_all_packed_hud"
        )
    }
});