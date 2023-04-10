import { Client, Guild, Message, Role, User } from "discord.js";
import { Manager } from "./Manager";
import { DiscordUtilities } from "../util/DiscordUtilities";

const { roles } = require('../../json/config.json');

export class RoleGiverManager extends Manager {
	constructor(client: Client, dUtil: DiscordUtilities) {
		super(client, dUtil);
	}

	async roleCheck(userScore: number, author: User, guild: Guild) {
		let len = roles.length;
		for (let i = 0; i < len; i++) {
			if (userScore >= roles[i].filter) {
				await this.dUtil.addRoleToUser(author, guild, this.getRoleInst(guild, roles[i].role)).catch(console.error);
			}
		}
	}

	getRoleInst(guild: Guild, roleName: string): Role | void {
		if(!guild) return;		
		return guild.roles.cache.find((r) => r.name == roleName);
	}
}