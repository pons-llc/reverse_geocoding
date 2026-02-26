/**
 * @license
 * Copyright (c) 2026 Pons LLC (合同会社Pons)
 * Licensed under the MIT License.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const AdmZip = require('adm-zip');

// ==========================================
// 1. 設定
// ==========================================
const INPUT_CSV = 'lg_code/lg_code.csv';
const OUTPUT_DIR = path.join(__dirname, 'parcel_data');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 2. CSV結合・ヘッダー修正関数
// ==========================================
async function processAndJoinCsv(posPath, masterPath) {
    // 1. 地番マスター (city) を読み込んでMapに格納 (prc_id -> {num1, num2, num3})
    const masterMap = new Map();
    const masterStream = fs.createReadStream(masterPath, { encoding: 'utf8' });
    const masterRl = readline.createInterface({ input: masterStream });

    let masterHeaderMap = {};
    let isMasterFirst = true;

    for await (const line of masterRl) {
        const cols = line.split(',');
        if (isMasterFirst) {
            // カラム位置を特定
            masterHeaderMap = {
                id: cols.indexOf('prc_id'),
                n1: cols.indexOf('prc_num1'),
                n2: cols.indexOf('prc_num2'),
                n3: cols.indexOf('prc_num3')
            };
            isMasterFirst = false;
            continue;
        }
        masterMap.set(cols[masterHeaderMap.id], {
            n1: cols[masterHeaderMap.n1] || '',
            n2: cols[masterHeaderMap.n2] || '',
            n3: cols[masterHeaderMap.n3] || ''
        });
    }

    // 2. 位置参照CSV (pos) を読み込みながら結合
    const tempPath = posPath + '.tmp';
    const posStream = fs.createReadStream(posPath, { encoding: 'utf8' });
    const writeStream = fs.createWriteStream(tempPath);
    const posRl = readline.createInterface({ input: posStream });

    let isPosFirst = true;
    let posIdIdx = -1;

    for await (const line of posRl) {
        const cols = line.split(',');
        if (isPosFirst) {
            posIdIdx = cols.indexOf('prc_id');
            // ヘッダー修正 & カラム追加
            let newHeader = line
            writeStream.write(`${newHeader},prc_num1,prc_num2,prc_num3\n`);
            isPosFirst = false;
        } else {
            const prcId = cols[posIdIdx];
            const masterData = masterMap.get(prcId) || { n1: '', n2: '', n3: '' };
            writeStream.write(`${line},${masterData.n1},${masterData.n2},${masterData.n3}\n`);
        }
    }

    // 後処理
    fs.unlinkSync(posPath);
    fs.unlinkSync(masterPath); // マスター側も不要なら削除
    fs.renameSync(tempPath, posPath);
    console.log(`✅ 結合・修正完了: ${path.basename(posPath)}`);
}

// ==========================================
// 3. ダウンロード関数
// ==========================================
async function downloadAndUnzip(url, targetDir) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));
    zip.extractAllTo(targetDir, true);
    return zip.getEntries().filter(e => !e.isDirectory && e.entryName.endsWith('.csv'))[0].entryName;
}

// ==========================================
// 4. メイン処理
// ==========================================
async function main() {
    console.log(`📂 ${INPUT_CSV} を読み込んでいます...`);
    const cityCodes = [];
    const rl = readline.createInterface({ input: fs.createReadStream(INPUT_CSV) });

    for await (const line of rl) {
        const code = line.split(',')[0].trim();
        if (/^\d{5,6}$/.test(code)) cityCodes.push(code);
    }

    /*for (const code of cityCodes) {
        console.log(`\n🚀 処理開始: 市区町村コード ${code}`);
        const posUrl = `https://data.address-br.digital.go.jp/mt_parcel_pos/city/mt_parcel_pos_city${code}.csv.zip`;
        const masterUrl = `https://data.address-br.digital.go.jp/mt_parcel/city/mt_parcel_city${code}.csv.zip`;

        try {
            console.log(`  ⬇️ 位置参照データ取得中...`);
            const posFileName = await downloadAndUnzip(posUrl, OUTPUT_DIR);

            console.log(`  ⬇️ 地番マスター取得中...`);
            const masterFileName = await downloadAndUnzip(masterUrl, OUTPUT_DIR);

            await processAndJoinCsv(
                path.join(OUTPUT_DIR, posFileName),
                path.join(OUTPUT_DIR, masterFileName)
            );

            await sleep(1000);
        } catch (error) {
            console.error(`  ❌ 失敗 (${code}):`, error.message);
        }
    }*/

    const posUrl = `https://data.address-br.digital.go.jp/mt_parcel_pos/city/mt_parcel_pos_city142051.csv.zip`;
    const masterUrl = `https://data.address-br.digital.go.jp/mt_parcel/city/mt_parcel_city142051.csv.zip`;
    console.log(`  ⬇️ 位置参照データ取得中...`);
    const posFileName = await downloadAndUnzip(posUrl, OUTPUT_DIR);

    console.log(`  ⬇️ 地番マスター取得中...`);
    const masterFileName = await downloadAndUnzip(masterUrl, OUTPUT_DIR);

    await processAndJoinCsv(
        path.join(OUTPUT_DIR, posFileName),
        path.join(OUTPUT_DIR, masterFileName)
    );

    console.log('\n🎉 全ての結合処理が完了しました！');
}

main();