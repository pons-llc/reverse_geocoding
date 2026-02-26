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

const INPUT_CSV = 'lg_code/lg_code.csv'; // 市区町村コードが書かれた入力CSV

const OUTPUT_DIR = path.join(__dirname, 'rsdt_data'); // 保存先フォルダ



// 保存先フォルダがなければ作成

if (!fs.existsSync(OUTPUT_DIR)) {

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

}



// サーバーに負荷をかけすぎないための待機関数

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));



// ==========================================

// 2. ヘッダーを書き換える関数（メモリ節約のためStreamを使用）

// ==========================================

async function modifyHeader(filePath) {

    const tempPath = filePath + '.tmp';

    const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

    const writeStream = fs.createWriteStream(tempPath);

    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });



    let isFirstLine = true;

    for await (const line of rl) {

        if (isFirstLine) {

            // ヘッダーの書き換え

            const newHeader = line;

            writeStream.write(newHeader + '\n');

            isFirstLine = false;

        } else {

            writeStream.write(line + '\n');

        }

    }



    // 古いファイルを消して、新しいファイルを元の名前にリネーム

    fs.unlinkSync(filePath);

    fs.renameSync(tempPath, filePath);

    console.log(`✅ ヘッダー修正完了: ${path.basename(filePath)}`);

}



// ==========================================

// 3. メインの処理

// ==========================================

async function main() {

    console.log(`📂 ${INPUT_CSV} を読み込んでいます...`);

    const cityCodes = [];

    for (i = 1; i < 48; i++) {
        cityCodes.push(String(i).padStart(2, '0'))
    }

    for (const code of cityCodes) {

        const url = `https://data.address-br.digital.go.jp/mt_rsdtdsp_rsdt_pos/pref/mt_rsdtdsp_rsdt_pos_pref${code}.csv.zip`;

        console.log(`⬇️ ダウンロード中: ${code} (${url})`);



        try {

            // Node.js 18+ の標準 fetch でダウンロード

            const response = await fetch(url);



            if (!response.ok) {

                console.error(`❌ エラー: ${code} のデータが見つかりません (Status: ${response.status})`);

                continue;

            }



            // ZIPデータをメモリ上に取得

            const arrayBuffer = await response.arrayBuffer();

            const buffer = Buffer.from(arrayBuffer);



            // AdmZip で解凍して保存

            const zip = new AdmZip(buffer);

            zip.extractAllTo(OUTPUT_DIR, true); // ZIPの中身を直接出力先フォルダに展開



            // 解凍されたCSVファイルを探してヘッダーを修正

            const zipEntries = zip.getEntries();

            for (const entry of zipEntries) {

                if (!entry.isDirectory && entry.entryName.endsWith('.csv')) {

                    const extractedFilePath = path.join(OUTPUT_DIR, entry.entryName);

                    await modifyHeader(extractedFilePath);

                }

            }



            // サーバーに優しく（1秒待機）

            await sleep(1000);



        } catch (error) {

            console.error(`❌ 処理失敗 (${code}):`, error.message);

        }

    }



    console.log('\n🎉 すべての処理が完了しました！');

    console.log(`📁 データは ${OUTPUT_DIR} フォルダに保存されています。`);

}



main();