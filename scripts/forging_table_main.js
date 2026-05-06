import { world, system, ItemStack } from "@minecraft/server";
import { ForgingTableModule } from "./module/ForgingTableModule";

ForgingTableModule.registerForgingRecipe(
    {
        primary: { tag: ["minecraft:is_tool", "minecraft:is_armor"] },
        secondary: { item: ["minecraft:enchanted_book"] },
        tool: { item: "minecraft:echo_shard" },
        cost: 2
    },
    data => {
        let enchantable = data.result.getComponent("minecraft:enchantable");
        if (enchantable && data.secondary && data.secondary.amount == 1) {
            let enchantments = enchantable.getEnchantments();
            if (enchantments.length > 0 && !enchantable.hasEnchantment("binding") && !enchantable.hasEnchantment("vanishing")) {
                let book_enchantable = data.secondary.getComponent("minecraft:enchantable");
                if (!book_enchantable.hasEnchantment(enchantments[0].type)) {
                } else { data.cancel = true; }
            } else { data.cancel = true; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { tag: ["minecraft:is_tool", "minecraft:is_armor"] },
        secondary: { item: ["minecraft:book", "minecraft:enchanted_book"] },
        tool: { item: "minecraft:echo_shard" },
        cost: 4
    },
    data => {
        let enchantable = data.result.getComponent("minecraft:enchantable");
        if (enchantable && data.secondary && data.secondary.amount == 1) {
            let enchantments = enchantable.getEnchantments();
            if (enchantments.length > 0 && !enchantable.hasEnchantment("binding") && !enchantable.hasEnchantment("vanishing")) {
                let book_enchantable = data.secondary.getComponent("minecraft:enchantable");
                if (!book_enchantable.hasEnchantment(enchantments[0].type)) {
                    let out_book = new ItemStack("minecraft:enchanted_book");
                    out_book.getComponent("minecraft:enchantable").addEnchantments(book_enchantable.getEnchantments().concat(enchantments[0]));
                    data.secondary = out_book;
                    enchantable.removeEnchantment(enchantments[0].type);
                    if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
                    data.primary = undefined;
                } else { data.cancel = true; }
            } else { data.cancel = true; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { tag: ["minecraft:is_tool", "minecraft:is_armor"] },
        tool: { item: "minecraft:nether_star" },
        cost: 7
    },
    data => {
        let enchantable = data.result.getComponent("minecraft:enchantable");
        if (enchantable) {
            let enchantments = enchantable.getEnchantments();
            if (enchantments.length > 0 && (enchantable.hasEnchantment("binding") || enchantable.hasEnchantment("vanishing"))) {
                if (enchantable.hasEnchantment("binding")) { enchantable.removeEnchantment("binding"); }
                else if (enchantable.hasEnchantment("vanishing")) { enchantable.removeEnchantment("vanishing"); }
                if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
                data.primary = undefined;
            } else { data.cancel = true; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { item: ["ts:fur_boots", "ts:fur_padded_chainmail_boots"] },
        secondary: { item: "minecraft:iron_sword" },
        tool: { item: "ts:fur_padding" },
        cost: 3
    },
    data => {
        if (data.primary && data.secondary) {
            let result = new ItemStack("ts:ice_skates");
            data.result = result;
            data.primary = undefined;
            data.secondary = undefined;
            if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { item: "ts:ice_skates" },
        secondary: { item: "minecraft:iron_chestplate" },
        tool: { item: "ts:frozen_rod" },
        cost: 5
    },
    data => {
        if (data.primary && data.secondary) {
            let result = new ItemStack("ts:armored_ice_skates");
            data.result = result;
            data.primary = undefined;
            data.secondary = undefined;
            if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { item: "minecraft:chainmail_helmet" },
        secondary: { item: "ts:fur_padding" },
        tool: { item: "ts:fur_padding" },
        cost: 2
    },
    data => {
        if (data.primary && data.secondary && data.secondary.amount >= 2) {
            let result = new ItemStack("ts:fur_padded_chainmail_helmet");
            data.result = result;
            data.primary = undefined;
            if (data.secondary.amount > 2) { data.secondary.amount -= 2; } else { data.secondary = undefined; }
            if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { item: "minecraft:chainmail_chestplate" },
        secondary: { item: "ts:fur_padding" },
        tool: { item: "ts:fur_padding" },
        cost: 3
    },
    data => {
        if (data.primary && data.secondary && data.secondary.amount >= 4) {
            let result = new ItemStack("ts:fur_padded_chainmail_chestplate");
            data.result = result;
            data.primary = undefined;
            if (data.secondary.amount > 4) { data.secondary.amount -= 4; } else { data.secondary = undefined; }
            if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { item: "minecraft:chainmail_leggings" },
        secondary: { item: "ts:fur_padding" },
        tool: { item: "ts:fur_padding" },
        cost: 3
    },
    data => {
        if (data.primary && data.secondary && data.secondary.amount >= 3) {
            let result = new ItemStack("ts:fur_padded_chainmail_leggings");
            data.result = result;
            data.primary = undefined;
            if (data.secondary.amount > 3) { data.secondary.amount -= 3; } else { data.secondary = undefined; }
            if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
        } else { data.cancel = true; }
    }
);

ForgingTableModule.registerForgingRecipe(
    {
        primary: { item: "minecraft:chainmail_boots" },
        secondary: { item: "ts:fur_padding" },
        tool: { item: "ts:fur_padding" },
        cost: 2
    },
    data => {
        if (data.primary && data.secondary && data.secondary.amount >= 2) {
            let result = new ItemStack("ts:fur_padded_chainmail_boots");
            data.result = result;
            data.primary = undefined;
            if (data.secondary.amount > 2) { data.secondary.amount -= 2; } else { data.secondary = undefined; }
            if (data.tool.amount > 1) { data.tool.amount -= 1; } else { data.tool = undefined; }
        } else { data.cancel = true; }
    }
);
