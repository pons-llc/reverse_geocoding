# Geocoding Project (Japan Address & Parcel)

このプロジェクトは、日本のデジタル庁が提供する「アドレス・ベース・レジストリ」等のデータを活用し、住居表示および地番データの取得、加工、および地図上での可視化を行うためのツール群です。

## 概要

日本の住所（住居表示）と地番（不動産登記関連）のデータを、Node.js スクリプトで自動取得・加工し、MapLibre GL JS と PMTiles を用いてウェブブラウザ上で高速に表示・クエリ・逆ジオコーディングできる環境を提供します。

## 主な機能

- **データ自動取得・加工**:
    - `rsdt_get.js`: デジタル庁のサイトから住居表示データを市区町村単位で一括ダウンロードし、ヘッダー修正等の加工を行います。
    - `chiban_get.js`: 地番の位置参照データと属性データをダウンロードし、結合（Join）して詳細な地番情報ファイルを作成します。
- **地図可視化 (Demo)**:
    - PMTiles 形式に変換された数百万件規模のポイントデータを、ブラウザ上でストレスなく表示します。
    - 地図上のポイントをクリックすることで、詳細な属性情報（住所コード、街区ID、地番等）を表示。
    - 住所マスター（CSV）との照合による、日本語住所文字列の復元（`geocoding.html`）。
- **設計図**:
    - `geocoding.drawio`: プロジェクトのデータフローや構造を記述した設計図ファイル。

## プロジェクト構成

```text
.
├── rsdt_get.js             # 住居表示データの取得・加工スクリプト
├── chiban_get.js           # 地番データの取得・加工スクリプト
├── geocoding.drawio       # 設計図 (Draw.io)
├── lg_code/                # 処理対象の自治体コード一覧（CSV）
├── demo/                   # ウェブ表示用デモ
│   ├── index.html          # 基本的な地図表示デモ
│   ├── geocoding.html      # 高度な地図表示・住所照合デモ（Tailwind CSS 使用）
│   └── mt_town_all.csv     # 住所マスターデータ（照合用）
├── rsdt_data/              # (生成物) 加工済み住居表示CSV
├── parcel_data/            # (生成物) 加工済み地番CSV
└── package.json            # 依存関係定義
```

## セットアップと使い方

### 1. 依存関係のインストール

```bash
npm install
```

### 2. データの取得

```bash
# 住居表示データの取得
node rsdt_get.js


# 地番データの取得と結合
node chiban_get.js
```
`lg_code/lg_code.csv` に記述された自治体コードに基づいてデータを取得します。

### 3.PMtilesへの変換
tippecanoeをインストールして、
以下のコマンドでPMtilesを生成してください。

住居表示データの変換
```
tippecanoe -o <アウトプット先Path>.pmtiles -Z 16 -z 16 --drop-rate=1 -l data --no-feature-limit -y lg_code -y machiaza_id -y blk_id -y rsdt_id -y rsdt2_id --projection=EPSG:4326 <住居表示データのはいっているディレクトリパス>/*.csv;
```

地番データの変換
```
tippecanoe -o <アウトプット先Path>.pmtiles -Z 16 -z 16 --drop-rate=1 -l data --no-feature-limit -y lg_code -y machiaza_id -y prc_id -y prc_num1 -y prc_num2 -y prc_num3 --projection=EPSG:4326 <地番データの入っているディレクトリパス>/mt_parcel_pos_city*.csv;
```


### ４. デモの実行

vite などの開発サーバーを使用して `demo/` ディレクトリを表示します。

```bash
npx vite
```

ブラウザで `http://localhost:5173/demo/index.html` または `geocoding.html` を開いてください。

デモに投入しているデータは藤沢市のみです。

### 4. PMTiles の作成（参考）

本プロジェクトのデモで使用している `.pmtiles` ファイルは、[tippecanoe](https://github.com/felt/tippecanoe) を使用して CSV から作成されています。

例:
```bash
tippecanoe -o output.pmtiles -zg --projection=EPSG:4326 rsdt_data/*.csv
```

## 使用データ

- デジタル庁 [アドレス・ベース・レジストリ](https://www.digital.go.jp/policies/base_registry_address)
- 国土地理院 [地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)

## 注意事項
アドレスベースレジストリデータはESPG：6668で作成されており、ベクトルタイルで変換する際に数十センチのズレが生じます。

## ライセンス

[MIT License](LICENSE)
Copyright (c) 2026 Pons LLC (合同会社Pons)
