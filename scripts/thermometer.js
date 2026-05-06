import { world, system } from "@minecraft/server";
import { setUIData } from "./ui_handler";
import { getThermometerTemperature } from "./temperature";

const EquipmentList = [ "Mainhand", "Offhand" ];
let thermometer_temporary = {};

system.runInterval(()=>{
    for(let playerData of world.getPlayers()){
        if(thermometer_temporary[playerData.id] == undefined) thermometer_temporary[playerData.id] = 35;

        thermometer_temporary[playerData.id] = thermometer_temporary[playerData.id] * 0.95 + getThermometerTemperature(playerData) * 0.05;

        let has_thermometer = playerData.hasTag("novelty:ac:thermometer");
        if(!has_thermometer){
            let equippable = playerData.getComponent("minecraft:equippable");
            EquipmentList.forEach(slot =>{
                let item = equippable.getEquipment(slot);
                if(item && item.typeId == "ac:thermometer") has_thermometer = true;
            })
        }
        if(has_thermometer){
            let temperature = Math.round(thermometer_temporary[playerData.id]);
            setUIData(playerData, "thermometer_counter", Math.min(99, Math.abs(temperature)))
            let status = 3;
            if(temperature < 0){
                status = 1;
            }else if(temperature < 14){
                status = 2;
            }else if(temperature > 48){
                status = 4;
            }
            setUIData(playerData, "thermometer_status", status);
        }else{
            setUIData(playerData, "thermometer_counter", 0);
            setUIData(playerData, "thermometer_status", 0);
        }
    }
}, 2);