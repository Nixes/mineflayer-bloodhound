import { Entity } from 'prismarine-entity';
import { Item } from 'prismarine-item';
import { Bot } from 'mineflayer';

declare module 'mineflayer-bloodhound' {
	export function bloodhound(bot: Bot): void;

	export interface BloodHound {
        yaw_correlation_enabled: boolean;
    }
}

declare module 'mineflayer' {
	interface BotEvents {
		onCorrelateAttack: (attacker: Entity, victim: Entity, weapon: Item) => void;
	}

	interface Bot {
		bloodhound: BloodHound
	}
}