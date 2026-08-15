import fs from 'fs';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, 'config.yaml');

let cache = null;

function loadConfig() {
    if (!cache) {
        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        cache = yaml.parse(content).permissions;
    }
    return cache;
}

export function getRole(qq) {
    const qqStr = String(qq);
    const config = loadConfig();
    
    // 检查是否是主人
    if (config.owners && config.owners[qqStr] !== undefined) {
        return config.owners[qqStr] === true ? 'master' : 'owner';
    }
    
    // 检查是否是管理员
    if (config.admins && config.admins[qqStr] !== undefined) {
        return 'admin';
    }
    
    // 默认普通成员
    return 'member';
}
