const { JOB_CATEGORIES, JOBS } = require('../config/family/jobConfig');
const fs = require('fs');
const path = require('path');

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const JobSystem = require('../family/JobSystem');
const jobSystem = new JobSystem();

module.exports = {
    name: "job",
    dev: "HNT",
    usedby: 0,
    info: "Hệ thống tìm việc làm",
    onPrefix: true,
    usages: ".job [list/apply/info]",
    cooldowns: 5,

    onLaunch: async function({ api, event, target }) {
        const { threadID, senderID } = event;
        const command = target[0]?.toLowerCase();

        try {
            const job = jobSystem.getJob(senderID);
            const education = jobSystem.loadEducation(senderID);

            if (!command) {
                await api.sendMessage(
                    "┏━━『 HỆ THỐNG VIỆC LÀM 』━━┓\n\n" +
                    "🎯 HƯỚNG DẪN SỬ DỤNG:\n\n" +
                    "📋 .job list\n└ Xem danh sách việc làm\n\n" +
                    "📝 .job apply <mã>\n└ Ứng tuyển việc làm\n\n" +
                    "ℹ️ .job info\n└ Xem công việc hiện tại\n\n" +
                    "❌ .job quit\n└ Nghỉ việc hiện tại\n\n" +
                    "💡 Ghi chú: Trình độ học vấn càng\ncao thì cơ hội việc làm càng tốt\n" +
                    "\n┗━━━━━━━━━━━━━━━━━┛",
                    threadID
                );
                return;
            }

            switch (command) {
                case "list": {
                    let msg = "┏━━『 DANH SÁCH VIỆC LÀM 』━━┓\n\n";
                    let availableJobs = [];

                    for (const [catId, category] of Object.entries(JOB_CATEGORIES)) {
                        msg += `🏢 ${category.name}\n`;
                        msg += "┏━━━━━━━━━━━━━━━┓\n";
                        msg += `${category.desc}\n\n`;

                        for (const jobId of category.jobs) {
                            const job = JOBS[jobId];
                            if (!job) continue;

                            const canApply = jobSystem.checkRequirements(job.requirements, education.degrees);
                            msg += `${canApply ? '✅' : '❌'} ${job.name}\n`;
                            msg += `├ Mã: ${jobId}\n`;
                            msg += `├ Lương: 💰 ${formatNumber(job.salary)} Xu/lần\n`;
                            if (job.requirements.length > 0) {
                                msg += `└ Yêu cầu: 📚 ${job.requirements.map(req => {
                                    const degree = require('../config/family/educationConfig').DEGREES[req];
                                    return degree ? degree.name : req;
                                }).join(", ")}\n`;
                            }
                            msg += "\n";

                            if (canApply) availableJobs.push(jobId);
                        }
                        msg += "┗━━━━━━━━━━━━━━━┛\n\n";
                    }

                    msg += "💡 VIỆC LÀM PHÙ HỢP:\n";
                    msg += `➤ Các mã: ${availableJobs.join(", ")}\n`;
                    msg += "➤ Ứng tuyển: .job apply <mã>\n";
                    
                    const listMsg = await api.sendMessage(msg, threadID);
                    return;
                }

                case "apply": {
                    const jobId = target[1]?.toLowerCase();
                    if (!jobId || !JOBS[jobId]) {
                        return api.sendMessage("❌ Vui lòng nhập mã công việc hợp lệ!", threadID);
                    }

                    try {
                        const selectedJob = await jobSystem.applyForJob(senderID, jobId);
                        return api.sendMessage(
                            "🎉 CHÚC MỪNG BẠN ĐƯỢC NHẬN VÀO LÀM VIỆC!\n\n" +
                            `Công việc: ${selectedJob.name}\n` +
                            `Lương: ${formatNumber(selectedJob.salary)} Xu/lần\n\n` +
                            "💡 Dùng .work để bắt đầu làm việc",
                            threadID
                        );
                    } catch (error) {
                        return api.sendMessage(`❌ ${error.message}`, threadID);
                    }
                }

                case "info": {
                    if (!job.currentJob) {
                        return api.sendMessage("❌ Bạn chưa có việc làm!", threadID);
                    }

                    const currentJob = JOBS[job.currentJob.id];
                    const jobType = currentJob.type || 'shipper';
                    const levels = jobSystem.JOB_LEVELS[jobType] || [];
                    const currentLevel = jobSystem.getJobLevel(jobType, job.workCount);

                    let levelInfo = "\n📊 THÔNG TIN CẤP BẬC:\n";
                    levels.forEach(level => {
                        const isCurrentLevel = currentLevel && level.name === currentLevel.name;
                        levelInfo += `${isCurrentLevel ? '➤' : '•'} ${level.name}\n`;
                        levelInfo += `  ├ Yêu cầu: ${level.minWork} lần làm việc\n`;
                        if (level.bonus) {
                            levelInfo += `  └ Thưởng: +${((level.bonus - 1) * 100).toFixed(0)}% lương\n`;
                        }
                    });

                    const infoMsg = await api.sendMessage(
                        "┏━━『 THÔNG TIN CÔNG VIỆC 』━━┓\n\n" +
                        `💼 Công việc: ${currentJob.name}\n` +
                        `💰 Lương: ${formatNumber(currentJob.salary)} Xu/lần\n` +
                        `📅 Ngày bắt đầu: ${new Date(job.currentJob.startDate).toLocaleDateString()}\n` +
                        `📈 Số lần làm việc: ${job.workCount}\n` +
                        `👔 Cấp bậc hiện tại: ${currentLevel?.name || 'Tập sự'}\n` +
                        levelInfo +
                        "\n💡 Dùng .work để làm việc kiếm tiền\n" +
                        "\n┗━━━━━━━━━━━━━━━━━┛",
                        threadID
                    );
                    return;
                }

                case "quit": {
                    if (!job.currentJob) {
                        return api.sendMessage("❌ Bạn chưa có việc làm!", threadID);
                    }

                    const oldJob = JOBS[job.currentJob.id];
                    job.currentJob = null;
                    this.saveJob(senderID, job);

                    return api.sendMessage(
                        `💼 Bạn đã nghỉ việc ${oldJob.name} thành công!\n` +
                        "💡 Dùng .job list để tìm việc mới",
                        threadID
                    );
                }
            }

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi!", threadID);
        }
    },

    loadJob(userID) {
        const jobPath = path.join(__dirname, '../database/json/family/job.json');
        try {
            if (!fs.existsSync(jobPath)) {
                fs.writeFileSync(jobPath, '{}');
            }
            const data = JSON.parse(fs.readFileSync(jobPath));
            return data[userID] || { currentJob: null };
        } catch (error) {
            console.error(error);
            return { currentJob: null };
        }
    },

    saveJob(userID, data) {
        const jobPath = path.join(__dirname, '../database/json/family/job.json');
        try {
            let jobData = {};
            if (fs.existsSync(jobPath)) {
                jobData = JSON.parse(fs.readFileSync(jobPath));
            }
            jobData[userID] = data;
            fs.writeFileSync(jobPath, JSON.stringify(jobData, null, 2));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
};
