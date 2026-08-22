import fs from 'fs';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, './config.yaml');

let cache = null;

function loadConfig() {
  if (!cache) {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    cache = yaml.parse(content);
  }
  return cache;
}

// 获取某人的实际可用角色（考虑权限开关）
export function getRole(qq) {
  const qqStr = String(qq);
  const config = loadConfig();
  const owners = config.permissions?.owners || {};
  const permStatus = config.permissions?.owner_permission || {};

  // 检查是否是主人
  if (owners[qqStr] !== undefined) {
    if (owners[qqStr] === true) {
      return 'master'; // 大主人，永远可用
    } else {
      // 小主人：检查权限状态，0=不可用，1或未配置=可用
      if (permStatus[qqStr] === 0) {
        return 'member'; // 权限关闭，当作普通成员
      }
      return 'owner'; // 权限开启，小主人
    }
  }

  // 检查是否是管理员
  if (config.permissions?.admins && config.permissions.admins[qqStr] !== undefined) {
    return 'admin';
  }

  // 默认普通成员
  return 'member';
}

// 检查是否有权限（true=有权限，false=无权限）
export function hasPermission(qq, requiredRole) {
  const role = getRole(qq);
  const roleLevel = {
    'member': 0,
    'admin': 1,
    'owner': 2,
    'master': 3
  };
  return roleLevel[role] >= roleLevel[requiredRole];
}
