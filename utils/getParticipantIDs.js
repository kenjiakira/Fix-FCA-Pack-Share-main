const fs = require('fs');
const path = require('path');

async function getThreadParticipantIDs(api, threadID) {
  let participantIDs = [];
  
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo && threadInfo.participantIDs) {
      return threadInfo.participantIDs;
    }
  } catch (error) {
    console.error("Error getting thread info from API:", error);
  }

  try {
    const threadsDBPath = path.join(__dirname, "../database/threads.json");
    const threadsDB = JSON.parse(fs.readFileSync(threadsDBPath, "utf8") || "{}");
    
    if (threadsDB[threadID]?.members) {
      return threadsDB[threadID].members;
    }
    if (threadsDB[threadID]?.userInfo) {
      return Object.keys(threadsDB[threadID].userInfo);
    }
  } catch (error) {
    console.error("Error reading threads database:", error);
  }

  try {
    const usersDBPath = path.join(__dirname, "../database/users.json");
    const usersDB = JSON.parse(fs.readFileSync(usersDBPath, "utf8") || "{}");
    
    return Object.keys(usersDB).filter(userID => 
      usersDB[userID].threadIDs?.includes(threadID)
    );
  } catch (error) {
    console.error("Error reading users database:", error);
  }

  return participantIDs;
}

module.exports = getThreadParticipantIDs;
