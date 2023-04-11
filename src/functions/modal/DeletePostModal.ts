import { ActionRowBuilder, Snowflake, TextInputBuilder } from 'discord.js';
import { TransactionType } from '../../models/enums/TransactionType';
import { BasePostModal } from './BasePostModal';

export class DeletePostModal extends BasePostModal {
    constructor(type: TransactionType, postID: Snowflake, have: string, want: string) {
        super();
        const components: Array<ActionRowBuilder<TextInputBuilder>> = this.buildBaseComponents(type, have, want);
        this.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(this.buildPostIDField(postID)));
        this.setCustomId("deletePostModal").setTitle("Confirm delete post?");
        this.addComponents(components);
    }
}