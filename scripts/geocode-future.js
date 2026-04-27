import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODE_CACHE_FILE = path.join(process.cwd(), 'data', 'geocode-cache.json');
const DATA_DIR = path.join(process.cwd(), 'data');
const TODAY = new Date().toISOString().slice(0, 10);

if (!GOOGLE_MAPS_API_KEY) {
    console.error('缺少 GOOGLE_MAPS_API_KEY 環境變數');
    process.exit(1);
}

async function geocodeAddress(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const response = await axios.get(url, {
        params: {
            address: address + ' 台灣',
            key: GOOGLE_MAPS_API_KEY,
            region: 'tw',
            language: 'zh-TW',
        },
        timeout: 10000,
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
        const loc = response.data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
    }
    return null;
}

async function main() {
    // 載入 cache
    const cacheRaw = await fs.readFile(GEOCODE_CACHE_FILE, 'utf-8').catch(() => '{}');
    const cache = JSON.parse(cacheRaw);

    // 找出未來活動缺座標的地址
    const targetFiles = ['bloodInfo-202604.json', 'bloodInfo-202605.json'];
    const missingAddresses = new Set();

    for (const fileName of targetFiles) {
        const filePath = path.join(DATA_DIR, fileName);
        const raw = await fs.readFile(filePath, 'utf-8').catch(() => null);
        if (!raw) continue;
        const data = JSON.parse(raw);
        for (const [d, events] of Object.entries(data)) {
            if (d < TODAY) continue;
            for (const event of events) {
                if (!event.coordinates && event.location && cache[event.location] == null) {
                    missingAddresses.add(event.location);
                }
            }
        }
    }

    const addresses = Array.from(missingAddresses);
    console.log(`需要查詢 ${addresses.length} 個地址...`);

    // 批次 geocoding（每秒最多 10 次）
    let success = 0;
    for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        process.stdout.write(`  [${i + 1}/${addresses.length}] ${addr.substring(0, 40)}...`);
        try {
            const result = await geocodeAddress(addr);
            cache[addr] = result;
            if (result) {
                success++;
                process.stdout.write(` ✓ (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
            } else {
                process.stdout.write(' ✗ 找不到\n');
            }
        } catch (err) {
            cache[addr] = null;
            process.stdout.write(` ✗ 錯誤: ${err.message}\n`);
        }
        // 避免超過 API 速率限制
        if (i < addresses.length - 1) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    // 儲存 cache
    await fs.writeFile(GEOCODE_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`\nCache 已更新，成功 ${success}/${addresses.length} 筆`);

    // 將座標寫回 JSON 檔案
    for (const fileName of targetFiles) {
        const filePath = path.join(DATA_DIR, fileName);
        const raw = await fs.readFile(filePath, 'utf-8').catch(() => null);
        if (!raw) continue;
        const data = JSON.parse(raw);
        let updated = 0;
        for (const [d, events] of Object.entries(data)) {
            if (d < TODAY) continue;
            for (const event of events) {
                if (!event.coordinates && event.location && cache[event.location]) {
                    event.coordinates = cache[event.location];
                    updated++;
                }
            }
        }
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`${fileName}: 補上 ${updated} 筆座標`);
    }
}

main().catch(console.error);
