const axios = require("axios");
const fs = require("fs");
const mcImageUrl = 'https://api.mcstatus.io/v2/widget/java/';

module.exports = {
  name: "mc",
  dev: "ShinTHL09, mod by pcoder2009",
  info: "Check Minecraft Server Status",
  usages: "<java/bedrock> <ip> <port>",
  cooldowns: 5,
    usedby: 0,
    onPrefix: true,

onLaunch: async function({ api, target, event }) {
  const { threadID, messageID } = event;

  if (this.config.credits !== "ShinTHL09, mod by pcoder2009") {
    api.sendMessage("Credits have been changed. The bot will stop.", threadID, () => process.exit(1));
    return;
  }

  if (!target[0]) return api.sendMessage("→ You must enter 'java' or 'bedrock'.", threadID, messageID);
  if (!target[1]) return api.sendMessage("→ You must enter an IP address.", threadID, messageID);
  if (!target[2]) return api.sendMessage("→ You must enter a port.", threadID, messageID);

  const type = target[0].toLowerCase();
  const ip = target[1];
  const port = target[2];

  let url, useImage = true;

  if (type === "java") {
    url = `https://api.mcstatus.io/v2/status/java/${ip}:${port}`;
  } else if (type === "bedrock") {
    url = `https://api.mcstatus.io/v2/status/bedrock/${ip}:${port}`;
    useImage = false;
  } else {
    return api.sendMessage("→ You must enter 'java' or 'bedrock' to check the server status.", threadID, messageID);
  }

  api.sendMessage("[⏳] Fetching server information, please wait...", threadID, messageID);

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (type === "java") {
      const serverName = data.motd?.clean || "Unknown";
      const onlinePlayers = data.players.online;
      const maxPlayers = data.players.max;
      const version = data.version.name_raw || "Unknown";
      const status = data.online ? "Online" : "Offline";

      let message = `》Minecraft Server Status《\n`;
      message += `➜ Server: ${ip}:${port}\n`;
      message += `➜ Status: ${status}\n`;
      message += `➜ MOTD: ${serverName}\n`;
      message += `➜ Players: ${onlinePlayers}/${maxPlayers}\n`;
      message += `➜ Version: ${version}\n`;

      if (useImage) {
        const imageUrl = `${mcImageUrl}${ip}:${port}?dark=true&rounded=false`;
        const imagePath = __dirname + "/cache/mcstatus.png";

        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, "binary"));

        api.sendMessage({ body: message, attachment: fs.createReadStream(imagePath) }, threadID, messageID);
      } else {
        api.sendMessage(message, threadID, messageID);
      }
    } else if (type === "bedrock") {
      const onlinePlayers = data.players.online;
      const maxPlayers = data.players.max;
      const version = data.version.name || "Unknown";
      const status = data.online ? "Online" : "Offline";

      let message = `》Minecraft Bedrock Server《\n`;
      message += `➜ Server: ${ip}:${port}\n`;
      message += `➜ Status: ${status}\n`;
      message += `➜ Players: ${onlinePlayers}/${maxPlayers}\n`;
      message += `➜ Version: ${version}\n`;

      api.sendMessage(message, threadID, messageID);
    }
  } catch (error) {
    console.log(error);
    api.sendMessage("→ Unable to connect to the API. Please check the IP and port.", threadID);
   }
  }
};