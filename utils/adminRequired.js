const adminRequired = async (api, event) => {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    return threadInfo.adminIDs.some(e => e.id == event.senderID);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

module.exports = { adminRequired };
