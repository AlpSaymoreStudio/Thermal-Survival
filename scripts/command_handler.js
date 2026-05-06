import { system, CommandPermissionLevel } from "@minecraft/server";
import { handleTemperatureAttributeCommand } from "./armor";
import { handleTemperatureAreaCommand, handleTemperatureCommand, handleTemperatureImmuneEffect } from "./temperature";
import { handleThirstCommand, handleThirstyEffect } from "./thirst";

system.beforeEvents.startup.subscribe(s =>{
    s.customCommandRegistry.registerEnum("ac:thirstModifier", [ "add", "set" ]);
    s.customCommandRegistry.registerEnum("ac:temperatureModifier", [ "add", "remove" ]);
    s.customCommandRegistry.registerEnum("ac:temperatureAttribute", [ "resistance", "insulation" ]);
    s.customCommandRegistry.registerEnum("ac:effectModifier", [ "set", "clear" ]);
    s.customCommandRegistry.registerEnum("ac:effectType", [ "thirsty", "temperature_immune" ]);
    s.customCommandRegistry.registerCommand(
        {
            name: "ac:temperature_attribute",
            description: "Apply temperature attribute modifier to the spesific players.",
            permissionLevel: CommandPermissionLevel.Admin,
            cheatsRequired: true,
            mandatoryParameters: [
                {
                    name: "source",
                    type: "PlayerSelector"
                },
                {
                    name: "ac:temperatureAttribute",
                    type: "Enum"
                },
                {
                    name: "ac:temperatureModifier",
                    type: "Enum"
                },
                {
                    name: "userProvidedId",
                    type: "String"
                }
            ],
            optionalParameters: [
                {
                    name: "value",
                    type: "Integer"
                }
            ]
        },
        handleTemperatureAttributeCommand
    );
    s.customCommandRegistry.registerCommand(
        {
            name: "ac:temperature",
            description: "Apply temperature modifier to the spesific players.",
            permissionLevel: CommandPermissionLevel.Admin,
            cheatsRequired: true,
            mandatoryParameters: [
                {
                    name: "source",
                    type: "PlayerSelector"
                },
                {
                    name: "ac:temperatureModifier",
                    type: "Enum"
                },
                {
                    name: "userProvidedId",
                    type: "String"
                }
            ],
            optionalParameters: [
                {
                    name: "value",
                    type: "Float"
                }
            ]
        },
        handleTemperatureCommand
    )
	s.customCommandRegistry.registerCommand(
		{
            name: "ac:thirst",
            description: "Apply thirst to the spesific players.",
            permissionLevel: CommandPermissionLevel.Admin,
			cheatsRequired: true,
            mandatoryParameters: [
                {
                    name: "source",
                    type: "PlayerSelector"
                },
                {
                    name: "ac:thirstModifier",
                    type: "Enum"
                },
                {
                    name: "value",
                    type: "Float"
                }
            ]
        },
		handleThirstCommand
	)
	s.customCommandRegistry.registerCommand(
		{
            name: "ac:temperature_area",
            description: "Apply temperature to the spesific area.",
            permissionLevel: CommandPermissionLevel.Admin,
			cheatsRequired: true,
            mandatoryParameters: [
                {
                    name: "ac:temperatureModifier",
                    type: "Enum"
                },
                {
                    name: "userProvidedId",
                    type: "String"
                }
            ],
            optionalParameters: [
                {
                    name: "location",
                    type: "Location"
                },
                {
                    name: "radius",
                    type: "Float"
                },
                {
                    name: "value",
                    type: "Float"
                }
            ]
        },
		handleTemperatureAreaCommand
	)
	s.customCommandRegistry.registerCommand(
		{
            name: "ac:adventure_condiment_effect",
            description: "Apply temperature to the spesific area.",
            permissionLevel: CommandPermissionLevel.Admin,
			cheatsRequired: true,
            mandatoryParameters: [
                {
                    name: "source",
                    type: "PlayerSelector"
                },
                {
                    name: "ac:effectModifier",
                    type: "Enum"
                },
                {
                    name: "ac:effectType",
                    type: "Enum"
                }
            ],
            optionalParameters: [
                {
                    name: "seconds",
                    type: "Integer"
                }
            ]
        },
		(e, target, param, effect, seconds) =>{
            if(param == "set" && seconds == undefined){
                return {
                    message: `You need define seconds to set effect`,
                    status: 1
                }
            }  
            if(effect == "temperature_immune"){
                return handleTemperatureImmuneEffect(e, target, param, effect, seconds);
            }else if(effect == "thirsty"){
                return handleThirstyEffect(e, target, param, effect, seconds);
            }
        }
	)
})