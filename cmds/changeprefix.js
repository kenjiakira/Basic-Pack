const fs = require('fs');

module.exports = {
    name: "changeprefix",
    usedby: 4,
    info: "Thay đổi Prefix lệnh của bot",
    dev: "Jonell Magallanes",
    usages: "changeprefix <Prefix mới>",
    onPrefix: true,
    cooldowns: 20,

    onLaunch: async function ({ api, event, target }) {
        const threadID = event.threadID;
        const newPrefix = target.join(" ").trim();

        if (!newPrefix) {
            return api.sendMessage("Vui lòng cung cấp một Prefix mới. Cách sử dụng: -changeprefix [Prefix mới]", threadID);
        }

        const confirmationMessage = `❓ THAY ĐỔI DẤU LỆNH \n${global.line}\nHãy phản hồi tin nhắn này (👍) để xác nhận thay đổi Prefix thành '${newPrefix}' hoặc phản hồi (👎) để hủy bỏ.`;

        const threadIDPath = './database/prefix/threadID.json';
        const data = { threadID: threadID };

        fs.writeFile(threadIDPath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                console.error("Không thể lưu threadID:", err);
            }
        });

        const sentMessage = await api.sendMessage(confirmationMessage, threadID);

        global.client.callReact.push({
            name: this.name,
            messageID: sentMessage.messageID,
            newPrefix: newPrefix
        });
    },

    callReact: async function ({ reaction, event, api }) {
        const { threadID, messageID } = event;
        const reactData = global.client.callReact.find(item => item.messageID === messageID);

        if (!reactData) return;

        const adminConfigPath = "./admin.json";

        if (reaction === '👍') {
            try {
                const adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, 'utf8'));
                adminConfig.prefix = reactData.newPrefix;

                fs.writeFile(adminConfigPath, JSON.stringify(adminConfig, null, 2), (err) => {
                    if (err) {
                        return api.sendMessage("Không thể lưu Prefix mới, vui lòng thử lại.", threadID);
                    }

                    api.sendMessage(`🔄 Đang thay đổi Prefix thành '${reactData.newPrefix}'\n${global.line}\nVui lòng đợi...`, threadID, () => {
                        api.unsendMessage(messageID);
                        setTimeout(() => process.exit(1), 2000);
                    });
                });
            } catch (err) {
                api.sendMessage("Không thể thay đổi Prefix, vui lòng thử lại.", threadID);
            }
        } else if (reaction === '👎') {
            api.sendMessage("❌ Thay đổi Prefix đã bị hủy", threadID, () => {
                api.unsendMessage(messageID); 
            });
        }

        global.client.callReact = global.client.callReact.filter(item => item.messageID !== messageID);
    }
};
