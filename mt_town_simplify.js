const fs = require('fs');
const readline = require('readline');

const inputPath = 'demo/mt_town_all.csv';
const outputPath = 'demo/mt_town_all.csv';

// 読み込みと書き込みの準備
const rs = fs.createReadStream(inputPath);
const ws = fs.createWriteStream(outputPath);
const rl = readline.createInterface({ input: rs });

let isFirstLine = true;

rl.on('line', (line) => {
    // カンマで分割して配列にする
    const columns = line.split(',');

    // ヘッダー（1行目）はそのまま残し、2行目以降を判定
    if (isFirstLine) {
        ws.write(line + '\n');
        isFirstLine = false;
        return;
    }

    // 4列目（インデックス3）が「神奈川県」の場合のみ書き出し
    // trim() を使って余計な空白を除去しておくと確実です
    if (columns[3] && columns[3].trim() === '神奈川県') {
        ws.write(line + '\n');
    }
});

rl.on('close', () => {
    console.log('処理が完了しました。');
});