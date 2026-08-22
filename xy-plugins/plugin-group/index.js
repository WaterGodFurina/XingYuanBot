console.log('===== index.js 被加载了 =====');
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import yaml from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ====== 加载配置 ======
function loadGroupConfig() {
  const yamlPath = join(__dirname, 'group.yaml');
  try {
    const raw = readFileSync(yamlPath, 'utf-8');
    return yaml.parse(raw);
  } catch (err) {
    console.error('[plugin-group] 读取 group.yaml 失败:', err.message);
    return {};
  }
}

// ====== 加载所有启用的子插件 ======
async function loadPlugins(config) {
  const plugins = {};
  const pluginDir = join(__dirname, 'plugin');

  for (const [name, conf] of Object.entries(config.plugins || {})) {
    if (!conf.enabled) continue;

    const scriptPath = join(pluginDir, conf.entry);
    if (!existsSync(scriptPath)) {
      console.warn(`[plugin-group] 找不到子插件: ${name} => ${conf.entry}`);
      continue;
    }

    try {
      const module = await import(pathToFileURL(scriptPath).href);
      plugins[name] = {
        config: conf,
        module: module,
      };
    } catch (err) {
      console.error(`[plugin-group] 加载子插件失败 (${name}):`, err);
    }
  }
  return plugins;
}

// ====== 指令匹配逻辑 ======
function matchCommand(msg, conf) {
  if (!conf) return false;
  const prefix = [...(conf.keywords || [])];

  // 1. 前缀匹配
  if (prefix.length > 0) {
    const hasPrefix = prefix.some(p => msg.startsWith(p));
    if (!hasPrefix) return false;
  }

  // 2. 关键词匹配
  if (conf.keys && conf.keys.length > 0) {
    const hasKey = conf.keys.some(kw => msg.includes(kw));
    if (!hasKey) return false;
  }

  // 前缀和关键词都满足（或无配置），匹配成功
  return true;
}

// ====== 主入口 ======
export default {
  async handle(e) {
    // 【核心修复】从消息数组中提取纯文本
    let msg = '';
    if (Array.isArray(e.message)) {
      for (const item of e.message) {
        if (item.type === 'text' && item.data && item.data.text) {
          msg += item.data.text;
        }
      }
    } else if (typeof e.message === 'string') {
      msg = e.message;
    } else if (e.msg) {
      msg = String(e.msg);
    }

    if (!msg) return false;

    const config = loadGroupConfig();
    const plugins = await loadPlugins(config);

    let handled = false;

    for (const [name, plugin] of Object.entries(plugins)) {
      const conf = plugin.config;
      console.log(`检查插件 ${name}, enabled=${conf.enabled}, conf:`, conf);
      if (!conf.enabled) continue;

      try {
        const codeType = conf.type || 'command';
        const fn = plugin.module.default || plugin.module.main;

        if (codeType === 'command') {
          if (matchCommand(msg, conf)) {
            if (typeof fn === 'function') {
              console.log(`[plugin-group] 命中函数插件: ${name}`);
              await fn(e, msg);
              handled = true;
              break;
            } else if (typeof fn === 'object' && fn !== null) {
              console.log(`[plugin-group] 命中对象插件: ${name}`);
              // 自动按关键词路由到对象中的方法
              if (msg.includes('设置主人') && typeof fn.setOwner === 'function') {
                await fn.setOwner(e, msg);
                handled = true;
              } else if (fn.onCommand && typeof fn.onCommand === 'function') {
                await fn.onCommand(e, msg);
                handled = true; 
              }
              if (handled) break;
            }
          }
        } else if (codeType === 'event') {
          const eventName = e.eventType || e.type || '';
          if (eventName === (conf.event_name || '')) {
            if (typeof fn === 'function') {
              await fn(e);
              handled = true;
              break;
            } else if (typeof fn === 'object' && fn !== null) {
              if (fn.onEvent && typeof fn.onEvent === 'function') {
                await fn.onEvent(e);
                handled = true;
              }
              if (handled) break;
            }
          }
        }
      } catch (err) {
        console.error(`[plugin-group] 执行插件 ${name} 出错:`, err);
      }
    }

    return handled;
  }
};

