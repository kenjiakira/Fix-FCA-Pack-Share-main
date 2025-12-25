const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Tăng version theo semantic versioning (patch)
 * @param {string} version - Version hiện tại (ví dụ: "1.0.0")
 * @returns {string} Version mới (ví dụ: "1.0.1")
 */
function incrementVersion(version) {
    if (!version || version === 'N/A') {
        return '1.0.0';
    }
    
    const parts = version.split('.');
    if (parts.length !== 3) {
        return '1.0.0';
    }
    
    let major = parseInt(parts[0]) || 0;
    let minor = parseInt(parts[1]) || 0;
    let patch = parseInt(parts[2]) || 0;
    
    // Tăng patch version (1.0.0 -> 1.0.1)
    patch++;
    
    return `${major}.${minor}.${patch}`;
}

/**
 * Tự động nâng phiên bản trong package.json
 * @returns {Object|null} {oldVersion, newVersion} hoặc null nếu lỗi
 */
function bumpVersion() {
    try {
        const packagePath = path.join(__dirname, '../../package.json');
        if (!fs.existsSync(packagePath)) {
            return null;
        }
        
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const oldVersion = packageData.version || '1.0.0';
        const newVersion = incrementVersion(oldVersion);
        
        packageData.version = newVersion;
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
        
        return { oldVersion, newVersion };
    } catch (error) {
        console.error('Error bumping version:', error);
        return null;
    }
}

/**
 * Lấy thông tin version từ package.json và git
 * @returns {Object} {version, gitTag, commitHash, branch}
 */
function getVersion() {
    try {
        const packagePath = path.join(__dirname, '../../package.json');
        let version = 'N/A';
        let gitTag = null;
        let commitHash = null;
        let branch = null;
        
        // Lấy version từ package.json
        if (fs.existsSync(packagePath)) {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            version = packageData.version || 'N/A';
        }
        
        // Kiểm tra xem có phải Git repo không
        const projectRoot = path.join(__dirname, '../..');
        const isGitRepo = fs.existsSync(path.join(projectRoot, '.git'));
        if (isGitRepo) {
            try {
                // Lấy Git tag gần nhất (nếu có)
                try {
                    gitTag = execSync('git describe --tags --abbrev=0', {
                        cwd: projectRoot,
                        encoding: 'utf8',
                        stdio: ['ignore', 'pipe', 'ignore']
                    }).trim();
                } catch (err) {
                    // Không có tag, bỏ qua
                }
                
                // Lấy commit hash ngắn
                try {
                    commitHash = execSync('git rev-parse --short HEAD', {
                        cwd: projectRoot,
                        encoding: 'utf8'
                    }).trim();
                } catch (err) {
                    // Không thể lấy commit hash
                }
                
                // Lấy branch hiện tại
                try {
                    branch = execSync('git rev-parse --abbrev-ref HEAD', {
                        cwd: projectRoot,
                        encoding: 'utf8'
                    }).trim();
                } catch (err) {
                    // Không thể lấy branch
                }
            } catch (err) {
                // Git commands failed
            }
        }
        
        return {
            version: version,
            gitTag: gitTag,
            commitHash: commitHash,
            branch: branch
        };
    } catch (error) {
        return {
            version: 'N/A',
            gitTag: null,
            commitHash: null,
            branch: null
        };
    }
}

module.exports = {
    incrementVersion,
    bumpVersion,
    getVersion
};
