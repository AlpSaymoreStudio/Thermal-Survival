import { world, system } from "@minecraft/server";
var before_event = {};
var before_event_id = 0;

var after_event = {};
var after_event_id = 0;

var execution_container = {};
var execution_cost = {};
let dimension;

system.run(()=>{
    dimension = world.getDimension("minecraft:overworld");
})

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

system.afterEvents.scriptEventReceive.subscribe(s =>{
    if(s.id == "ft:process" && !s.message.startsWith("CANCELED") && execution_container[s.message]){
        let inventory = s.sourceEntity.getComponent("minecraft:inventory").container;
        let data = {
            cancel: false,
            primary: inventory.getItem(0),
            secondary: inventory.getItem(1),
            tool: inventory.getItem(2),
            result: inventory.getItem(3)
        }
        
        execution_container[s.message](data);

        if(data.cancel){
            s.sourceEntity.runCommand("scriptevent ft:process CANCELED " + execution_cost[s.message]);
        }else{
            inventory.setItem(0, data.primary);
            inventory.setItem(1, data.secondary);
            inventory.setItem(2, data.tool);
            inventory.setItem(3, data.result);
        }
    }
    if(s.id == "ft:before_event" && !s.message.startsWith("CANCELED")){
        let inventory = s.sourceEntity.getComponent("minecraft:inventory").container;
        let data = {
            cancel: false,
            uuid: s.message,
            primary: inventory.getItem(0),
            secondary: inventory.getItem(1),
            tool: inventory.getItem(2),
            result: inventory.getItem(3)
        }

        for(let callback of Object.keys(before_event)){
            before_event[callback](data);

            if(data.cancel){
                s.sourceEntity.runCommand("scriptevent ft:before_event CANCELED");
                break;
            }
        }
    }
    if(s.id == "ft:after_event"){
        let inventory = s.sourceEntity.getComponent("minecraft:inventory").container;
        let data = {
            uuid: s.message,
            primary: inventory.getItem(0),
            secondary: inventory.getItem(1),
            tool: inventory.getItem(2),
            result: inventory.getItem(3)
        }

        for(let callback of Object.keys(after_event)){
            after_event[callback](data);
            
            inventory.setItem(0, data.primary);
            inventory.setItem(1, data.secondary);
            inventory.setItem(2, data.tool);
            inventory.setItem(3, data.result);
        }
    }
}, { namespaces: [ "ft" ]});

export class ForgingTableModule {
    static registerForgingRecipe(params, handler) {
        system.runTimeout(()=>{
            let uuid = generateUUID();
            dimension.runCommand("scriptevent ft:register " + uuid + " " + JSON.stringify(params));
            execution_container[uuid] = handler;
            execution_cost[uuid] = params.cost;
        }, 2);
    }
    static beforeEvents = {
        handleRecipeProcess: {
            subscribe(callback){
                let id = before_event_id;
                before_event[before_event_id] = callback;
                before_event_id++;
                return id;
            },
            unsubscribe(id){
                delete before_event[id];
            }
        }
    }
    static afterEvents = {
        handleRecipeProcess: {
            subscribe(callback){
                let id = after_event_id;
                after_event[after_event_id] = callback;
                after_event_id++;
                return id;
            },
            unsubscribe(id){
                delete after_event[id];
            }
        }
    }
}