import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { join } from 'path';

// 生成 JWT Token
async function getToken() {
    const kid = 'CM58H3JDYJ'; // 你的凭据ID
    const privateKeyPath = join(process.cwd(), 'ed25519-private.pem');
    const privateKeyPem = readFileSync(privateKeyPath, 'utf8');

    // 解析 Ed25519 私钥
    const privateKey = await jose.importPKCS8(privateKeyPem, 'EdDSA');

    // 生成 JWT
    const jwt = await new SignJWT({})
        .setProtectedHeader({ alg: 'EdDSA', kid: kid })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(privateKey);

    return jwt;
}

export default async function handler({ msg, sendMsg, text, isGroup }) {
    const chatId = isGroup ? msg.group_id : msg.user_id;

    if (text.includes('天气')) {
        try {
            const city = text.replace(/天气/g, '').trim() || '广州';
            
            // 1. 获取 Token
            const token = await getToken();
            const headers = {
                'Authorization': 'JWT ' + token
            };

            // 2. 查找城市 ID
            const cityRes = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${city}`, { headers });
            const cityData = await cityRes.json();
            
            if (!cityData.location || cityData.location.length === 0) {
                return sendMsg(chatId, '❌ 未找到该城市');
            }
            const locationId = cityData.location[0].id;

            // 3. 获取实时天气
            const weatherRes = await fetch(`https://devapi.qweather.com/v7/weather/now?location=${locationId}`, { headers });
            const weatherData = await weatherRes.json();
            
            if (weatherData.code !== '200') throw new Error('天气接口返回异常: ' + weatherData.code);

            const now = weatherData.now;
            return sendMsg(chatId, `☁️ ${city} 实时天气：\n🌡️ 气温：${now.temp}℃\n☀️ 天气：${now.text}\n💨 风向：${now.windDir} ${now.windScale}级`);

        } catch (err) {
            console.error(err);
            return sendMsg(chatId, '❌ 查询失败，请稍后重试');
        }
    }
}
