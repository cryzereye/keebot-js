const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { relevant_roles, newListingsCHID, testCHID, me_id, dev, sellCHID, buyCHID, tradeCHID } = require('../json/config.json');
const Post = require('../models/Post');
const dUtil = require('../util/DiscordUtil');

class PostManager {
  constructor() { }

  async newPostModal(interaction) {
    const type = interaction.options.getString('type');
    const itemrole = interaction.options.getRole('itemrole');

    let modal = this.generateModal("new", type, itemrole);
    if (modal)
      return await interaction.showModal(modal).catch(console.error);
    else {
      return await interaction.reply({
        content: "**INVALID ITEM ROLE**",
        ephemeral: true
      }).catch(console.error);
    }
  }

  async newPost(client, guild, type, authorID, postDate, data) {
    let channelID = this.getChannelFromType(type); // test purposes only
    let content = "";
    let newListContent = "";
    let msgURL = "";

    // goes into buy/sell/trade channel
    content += `**Post by <@!${authorID}>**\n\n`;
    content += `HAVE: ${data.have}\n`;
    content += `WANT: ${data.want}\n`;
    if ("imgur" in data)
      content += `${data.imgur}\n\n`;

    if ("details" in data)
      content += `${data.details}\n`;

    // goes into new-listings channel
    newListContent += `**New <#${channelID}> post from <@!${authorID}>**\n`;
    if ("roleID" in data)
      newListContent += `For <@&${data.roleID}>\n`;
    newListContent += `HAVE:  ${data.have}\n`;
    newListContent += `WANT:  ${data.want}\n`;

    // gets sent message from buy/sell/trade channels then gets id, generates url to be sent in #new-listings
    const message = await dUtil.sendMessageToChannel(client, guild.id, channelID, content);
    msgURL = Post.generateUrl(channelID, message.id);
    newListContent += `${msgURL}`;

    const newListMsg = await dUtil.sendMessageToChannel(client, guild.id, newListingsCHID, newListContent);

    Post.new(
      message.id,
      newListMsg.id,
      authorID,
      type,
      data.have,
      data.want,
      postDate
    );

    return {
      posted: true,
      url: msgURL,
      newListingURL: Post.generateUrl(newListingsCHID, newListMsg.id),
    };
  }

  async editPostModal(interaction) {
    const postID = interaction.options.getString('id');
    let editPost = Post.get(postID);
    if (editPost.authorID !== interaction.user.id) {
      return await interaction.reply({
        content: `Invalid! Make sure you are editing your own post. Pinging <@!${me_id}>`,
        ephemeral: true
      }).catch(console.error);
    }

    let modal = this.generateModal("edit", "", null, postID, editPost.have, editPost.want);
    if (modal)
      return await interaction.showModal(modal).catch(console.error);
    else {
      return await interaction.reply({
        content: `Error in editing post. Pinging <@!${me_id}>`,
        ephemeral: true
      }).catch(console.error);
    }
  }

  async editPost(client, guild, authorID, data) {
    const record = await Post.get(data.postID);
    const channelID = this.getChannelFromType(record.type);
    const postMsg = await dUtil.getMessageFromID(guild, channelID, data.postID).catch(console.error);

    if (!postMsg) {
      return {
        edited: false,
        url: "",
        newListingURL: ""
      };
    }

    let content = postMsg.content.split('\n');
    let newContent = "";
    let newListContent = "";
    let haveEdited = false;
    let wantEdited = false;

    content.map(line => {
      if (line.startsWith("HAVE: ") && !haveEdited)
        newContent += `HAVE: ${data.have}\n`;
      else if (line.startsWith("WANT: ") && !wantEdited)
        newContent += `WANT: ${data.want}\n`;
      else
        newContent += line + "\n"
    });

    const message = await postMsg.edit(newContent).catch(console.error);
    if (!message) {
      return {
        edited: false,
        url: "",
        newListingURL: ""
      };
    }
    let msgURL = Post.generateUrl(message.channel.id, message.id);

    newListContent += `**UPDATED <#${channelID}> post from <@!${authorID}>**\n`;
    newListContent += `HAVE: ~~${record.have}~~ ${data.have}\n`;
    newListContent += `WANT: ~~${record.want}~~ ${data.want}\n`;
    newListContent += `${msgURL}`;

    const newListMsg = await dUtil.sendMessageToChannel(client, guild.id, newListingsCHID, newListContent).catch(console.error);

    Post.edit(
      data.postID,
      data.have,
      data.want,
      data.editDate
    );

    return {
      edited: true,
      url: msgURL,
      newListingURL: Post.generateUrl(newListingsCHID, newListMsg.id)
    };
  }

  markSoldPost() { }

  markUnsoldPost() { }

  deletePost() { }

  buildRoleField(itemrole) {
    const role = new TextInputBuilder()
      .setCustomId(itemrole.id.toString())
      .setLabel("Item Role [DO NOT EDIT ROLE]")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(itemrole.id.toString())
      .setValue(itemrole.name);
    return role;
  }

  buildHaveField(value) {
    const have = new TextInputBuilder()
      .setCustomId('have')
      .setLabel("Have")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('H:')
      .setMaxLength(200)
      .setMinLength(1)
      .setRequired(true);
    if (value) have.setValue(value);
    return have;
  }

  buildWantField(value) {
    const want = new TextInputBuilder()
      .setCustomId('want')
      .setLabel("Want")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('W:')
      .setMaxLength(200)
      .setMinLength(1)
      .setRequired(true);
    if (value) want.setValue(value);
    return want;
  }

  buildImgurField() {
    const imgur = new TextInputBuilder()
      .setCustomId('imgur')
      .setLabel("Imgur Link")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://imgur.com/a/xxxxxxxxxxx')
      .setRequired(false);
    return imgur;
  }

  buildDetailsField() {
    const want = new TextInputBuilder()
      .setCustomId('details')
      .setLabel("Details")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setMinLength(1)
      .setPlaceholder('Enter post details here...')
      .setRequired(false);
    return want;
  }

  buildPostIDField(value) {
    const postId = new TextInputBuilder()
      .setCustomId(value)
      .setLabel("Post ID: DO NOT EDIT")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(value)
      .setRequired(true);
    if (value) postId.setValue(value);
    return postId;
  }

  generateModal(mode, type, itemrole, postID, have, want) {
    let modal = new ModalBuilder();
    let components = [
      new ActionRowBuilder().addComponents(this.buildHaveField(have)),
      new ActionRowBuilder().addComponents(this.buildWantField(want)),
    ];

    if (mode == "new") {
      components.push(new ActionRowBuilder().addComponents(this.buildImgurField()));
      components.push(new ActionRowBuilder().addComponents(this.buildDetailsField()));

      const { id, title } = this.getIdTitleFromType(type);
      modal.setCustomId(id).setTitle(`${title} an item!`);

      if (itemrole) {
        if (relevant_roles.includes(itemrole.name))
          return;
        modal.addComponents(new ActionRowBuilder().addComponents(this.buildRoleField(itemrole)));
      }
    }
    else if (mode == "edit") {
      modal.addComponents(new ActionRowBuilder().addComponents(this.buildPostIDField(postID)));
      modal.setCustomId("editPostModal").setTitle("Edit your post!");
    }

    modal.addComponents(components);
    return modal;

  }

  getIdTitleFromType(type) {
    switch (type) {
      case "buy": return { id: "buyPostModal", title: "Buy" };
      case "sell": return { id: "sellPostModal", title: "Sell" };
      case "trade": return { id: "tradePostModal", title: "Trade" };
    }
  }

  getChannelFromType(type) {
    if (dev) return testCHID;
    switch (type) {
      case "buy": return sellCHID;
      case "sell": return buyCHID
      case "trade": return tradeCHID;
    }
  }
}

module.exports = { PostManager }