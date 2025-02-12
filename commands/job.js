const { JOB_CATEGORIES, JOBS } = require('../config/jobConfig');
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
            const education = this.loadEducation(senderID);

            if (!command) {
                return api.sendMessage(
                    "💼 HỆ THỐNG VIỆC LÀM 💼\n" +
                    "━━━━━━━━━━━━━━━━━━\n\n" +
                    "1. list - Xem danh sách việc làm\n" +
                    "2. apply [mã] - Ứng tuyển việc làm\n" +
                    "3. info - Xem công việc hiện tại\n" +
                    "4. quit - Nghỉ việc\n\n" +
                    "💡 Học vấn càng cao, công việc càng tốt",
                    threadID
                );
            }

            switch (command) {
                case "list": {
                    let msg = "💼 DANH SÁCH VIỆC LÀM 💼\n━━━━━━━━━━━━━━━━━━\n\n";
                    let availableJobs = [];

                    for (const [catId, category] of Object.entries(JOB_CATEGORIES)) {
                        msg += `【${category.name}】\n`;
                        msg += `${category.desc}\n\n`;

                        for (const jobId of category.jobs) {
                            const job = JOBS[jobId];
                            if (!job) continue;

                            const canApply = this.checkRequirements(job.requirements, education.degrees);
                            msg += `${canApply ? '✅' : '❌'} ${job.name}\n`;
                            msg += `• Mã: ${jobId}\n`;
                            msg += `• Lương: ${formatNumber(job.salary)} Xu/lần\n`;
                            if (job.requirements.length > 0) {
                                msg += `• Yêu cầu: ${job.requirements.map(req => {
                                    const degree = require('../config/educationConfig').DEGREES[req];
                                    return degree ? degree.name : req;
                                }).join(", ")}\n`;
                            }
                            msg += "\n";

                            if (canApply) availableJobs.push(jobId);
                        }
                    }

                    msg += "💡 HƯỚNG DẪN:\n";
                    msg += `• Công việc bạn có thể ứng tuyển: ${availableJobs.join(", ")}\n`;
                    msg += "• Dùng .job apply [mã] để ứng tuyển\n";
                    
                    return api.sendMessage(msg, threadID);
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
                    return api.sendMessage(
                        "💼 THÔNG TIN CÔNG VIỆC 💼\n" +
                        "━━━━━━━━━━━━━━━━━━\n\n" +
                        `Công việc: ${currentJob.name}\n` +
                        `Lương: ${formatNumber(currentJob.salary)} Xu/lần\n` +
                        `Ngày bắt đầu: ${new Date(job.currentJob.startDate).toLocaleDateString()}\n\n` +
                        "💡 Dùng .work để làm việc kiếm tiền",
                        threadID
                    );
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

    checkRequirements(requirements, degrees) {
        if (!requirements || requirements.length === 0) return true;
        // Thêm log để debug
        console.log('Checking requirements:', requirements);
        console.log('User degrees:', degrees);
        const result = requirements.some(req => degrees.includes(req));
        console.log('Check result:', result);
        return result;
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
    },

    loadEducation(userID) {
        const educationPath = path.join(__dirname, '../database/json/family/familyeducation.json');
        try {
            if (!fs.existsSync(educationPath)) return { degrees: [] };
            const data = JSON.parse(fs.readFileSync(educationPath));
            let education = data[userID] || { degrees: [] };
            
            // Thêm chuyển đổi mã
            education.degrees = education.degrees.map(degree => {
                return degree === "highschool" ? "e1" : degree;
            });

            return education;
        } catch (error) {
            console.error(error);
            return { degrees: [] };
        }
    }
};
