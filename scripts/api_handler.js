import { world, system } from "@minecraft/server";
import { getArmorTemperatureData } from "./database";
import { generateInsulationLoreItem, generateLoreItem } from "./armor";

const EquipmentList = [ "Head", "Chest", "Feet", "Legs" ];

system.runInterval(()=>{
    let armor_data = getArmorTemperatureData();
    for(let playerData of world.getPlayers()){
        let inventory = playerData.getComponent("minecraft:inventory");
        let container = inventory.container;
        let size = inventory.inventorySize;

        for(let i = 0; i < size; i++){
            let item = container.getItem(i);
            if(item && item.typeId in armor_data){
                let change = false;

                let temperature_resistance = armor_data[item.typeId].temperature_resistance || 0;
                let temperature_insulation = armor_data[item.typeId].temperature_insulation || false;

                if(temperature_resistance != 0 && item.getDynamicProperty("temperature_resistance") == undefined){
                    item.setDynamicProperty("temperature_resistance", 0);
                    item = generateLoreItem(item, temperature_resistance);
                    change = true;
                }

                if(temperature_insulation && item.getDynamicProperty("temperature_insulation") == undefined){
                    item.setDynamicProperty("temperature_insulation", 1);
                    item = generateInsulationLoreItem(item);
                    change = true;
                }

                if(change) container.setItem(i, item);
            }
        }
        
        let equippable = playerData.getComponent("minecraft:equippable");
        
        EquipmentList.forEach(slot =>{
            let item = equippable.getEquipment(slot);
            if(item && item.typeId in armor_data){
                let change = false;

                let temperature_resistance = armor_data[item.typeId].temperature_resistance || 0;
                let temperature_insulation = armor_data[item.typeId].temperature_insulation || false;

                if(temperature_resistance != 0 && item.getDynamicProperty("temperature_resistance") == undefined){
                    item.setDynamicProperty("temperature_resistance", 0);
                    item = generateLoreItem(item, temperature_resistance);
                    change = true;
                }

                if(temperature_insulation && item.getDynamicProperty("temperature_insulation") == undefined){
                    item.setDynamicProperty("temperature_insulation", 1);
                    item = generateInsulationLoreItem(item);
                    change = true;
                }

                if(change) equippable.setEquipment(slot, item);
            }
        })
    }
});