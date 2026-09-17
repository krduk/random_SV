/**
 * 世界中のストリートビュー対応地点データベース
 * 各大陸・各国の有名スポット、美しい街並み、自然、絶景を網羅
 */
const WORLD_LOCATIONS = [
  // --- 日本 ---
  {
    flag: "🇯🇵",
    country: "日本",
    region: "東京都",
    city: "港区（芝公園・東京タワー前）",
    lat: 35.657577,
    lng: 139.745484,
    heading: 30,
    pitch: 10,
    demoImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "京都府",
    city: "京都市東山区（祇園・八坂通り）",
    lat: 35.000000,
    lng: 135.778800,
    heading: 80,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "山梨県",
    city: "南都留郡富士河口湖町（河口湖北岸）",
    lat: 35.517094,
    lng: 138.751786,
    heading: 195,
    pitch: 8,
    demoImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "岐阜県",
    city: "大野郡白川村（荻町合掌造り集落）",
    lat: 36.256241,
    lng: 136.906663,
    heading: 140,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "沖縄県",
    city: "国頭郡本部町（備瀬フクギ並木）",
    lat: 26.702758,
    lng: 127.879133,
    heading: 270,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "北海道",
    city: "小樽市（小樽運河遊歩道）",
    lat: 43.199896,
    lng: 141.002235,
    heading: 130,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1600&q=80"
  },

  // --- フランス ---
  {
    flag: "🇫🇷",
    country: "フランス",
    region: "イル＝ド＝フランス",
    city: "パリ（エッフェル塔前・イエナ橋）",
    lat: 48.858370,
    lng: 2.294481,
    heading: 145,
    pitch: 15,
    demoImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇫🇷",
    country: "フランス",
    region: "ノルマンディー",
    city: "マンシュ県（モン・サン＝ミシェル参道橋）",
    lat: 48.636063,
    lng: -1.511457,
    heading: 0,
    pitch: 10,
    demoImage: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇫🇷",
    country: "フランス",
    region: "プロヴァンス＝アルプ＝コート・ダジュール",
    city: "ニース（海岸通りプロムナード）",
    lat: 43.695304,
    lng: 7.262572,
    heading: 220,
    pitch: 2,
    demoImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80"
  },

  // --- イタリア ---
  {
    flag: "🇮🇹",
    country: "イタリア",
    region: "ラツィオ州",
    city: "ローマ（コロッセオ前・フォーリ・インペリアーリ通り）",
    lat: 41.890210,
    lng: 12.492231,
    heading: 75,
    pitch: 10,
    demoImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇮🇹",
    country: "イタリア",
    region: "ヴェネト州",
    city: "ヴェネツィア（カナル・グランデ沿岸）",
    lat: 45.437190,
    lng: 12.334589,
    heading: 260,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇮🇹",
    country: "イタリア",
    region: "トスカーナ州",
    city: "フィレンツェ（ドゥオーモ前広場）",
    lat: 43.773145,
    lng: 11.255960,
    heading: 110,
    pitch: 15,
    demoImage: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇮🇹",
    country: "イタリア",
    region: "カンパニア州",
    city: "ポジターノ（アマルフィ海岸断崖道路）",
    lat: 40.628059,
    lng: 14.484980,
    heading: 190,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1600&q=80"
  },

  // --- イギリス ---
  {
    flag: "🇬🇧",
    country: "イギリス",
    region: "グレーター・ロンドン",
    city: "ロンドン（ウェストミンスター橋・ビッグベン前）",
    lat: 51.500729,
    lng: -0.124625,
    heading: 260,
    pitch: 8,
    demoImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇬🇧",
    country: "イギリス",
    region: "スコットランド",
    city: "エディンバラ（ロイヤル・マイル石畳街）",
    lat: 55.948595,
    lng: -3.199913,
    heading: 240,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=80"
  },

  // --- アメリカ合衆国 ---
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "ニューヨーク州",
    city: "ニューヨーク（ブロードウェイ・タイムズスクエア）",
    lat: 40.758896,
    lng: -73.985130,
    heading: 40,
    pitch: 15,
    demoImage: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "カリフォルニア州",
    city: "サンフランシスコ（ゴールデンゲート海峡展望路）",
    lat: 37.829899,
    lng: -122.483488,
    heading: 150,
    pitch: -2,
    demoImage: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "アリゾナ州",
    city: "グランドキャニオン国立公園（デザートビュー・ドライブ）",
    lat: 36.059128,
    lng: -112.109346,
    heading: 15,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "ハワイ州",
    city: "ホノルル（カラカウア・アベニュー沿岸）",
    lat: 21.276550,
    lng: -157.827254,
    heading: 120,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
  },

  // --- スペイン ---
  {
    flag: "🇪🇸",
    country: "スペイン",
    region: "カタルーニャ州",
    city: "バルセロナ（マリョルカ通り・サグラダファミリア前）",
    lat: 41.403630,
    lng: 2.174356,
    heading: 230,
    pitch: 25,
    demoImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇪🇸",
    country: "スペイン",
    region: "アンダルシア州",
    city: "セビリア（スペイン広場回廊）",
    lat: 37.377222,
    lng: -5.986944,
    heading: 180,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1600&q=80"
  },

  // --- ドイツ ---
  {
    flag: "🇩🇪",
    country: "ドイツ",
    region: "バイエルン州",
    city: "シュヴァンガウ（ノイシュヴァンシュタイン城麓）",
    lat: 47.557574,
    lng: 10.749800,
    heading: 170,
    pitch: 20,
    demoImage: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇩🇪",
    country: "ドイツ",
    region: "ベルリン",
    city: "ミッテ区（パリザー広場・ブランデンブルク門）",
    lat: 52.516275,
    lng: 13.377704,
    heading: 85,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1600&q=80"
  },

  // --- スイス ---
  {
    flag: "🇨🇭",
    country: "スイス",
    region: "ヴァレー州",
    city: "ツェルマット（キルヒ通り・マッターホルン遠望）",
    lat: 45.976543,
    lng: 7.749117,
    heading: 215,
    pitch: 18,
    demoImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇨🇭",
    country: "スイス",
    region: "ベルン州",
    city: "ラウターブルンネン（滝を望む谷底街道）",
    lat: 46.593506,
    lng: 7.907914,
    heading: 160,
    pitch: 15,
    demoImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80"
  },

  // --- ノルウェー ---
  {
    flag: "🇳🇴",
    country: "ノルウェー",
    region: "ヌールラン県",
    city: "ロフォーテン諸島（レーネ漁村道路）",
    lat: 67.925574,
    lng: 13.088339,
    heading: 310,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80"
  },

  // --- オーストラリア ---
  {
    flag: "🇦🇺",
    country: "オーストラリア",
    region: "ニューサウスウェールズ州",
    city: "シドニー（ベネロング・ポイント前遊歩道）",
    lat: -33.856784,
    lng: 151.215297,
    heading: 30,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇦🇺",
    country: "オーストラリア",
    region: "ビクトリア州",
    city: "プリンスタウン（グレートオーシャンロード展望台）",
    lat: -38.665798,
    lng: 143.104882,
    heading: 200,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1600&q=80"
  },

  // --- ニュージーランド ---
  {
    flag: "🇳🇿",
    country: "ニュージーランド",
    region: "オタゴ地方",
    city: "クイーンズタウン（ワカティプ湖岸通り）",
    lat: -45.031162,
    lng: 168.662644,
    heading: 230,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80"
  },

  // --- カナダ ---
  {
    flag: "🇨🇦",
    country: "カナダ",
    region: "アルバータ州",
    city: "バンフ（レイク・ルイーズ湖畔歩道）",
    lat: 51.417646,
    lng: -116.216839,
    heading: 250,
    pitch: 10,
    demoImage: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1600&q=80"
  },

  // --- ギリシャ ---
  {
    flag: "🇬🇷",
    country: "ギリシャ",
    region: "南エーゲ地方",
    city: "サントリーニ島（イアの白壁崖道）",
    lat: 36.461821,
    lng: 25.375328,
    heading: 260,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80"
  },

  // --- オランダ ---
  {
    flag: "🇳🇱",
    country: "オランダ",
    region: "北ホラント州",
    city: "アムステルダム（プリンセン運河沿い石畳）",
    lat: 52.373056,
    lng: 4.883333,
    heading: 160,
    pitch: 2,
    demoImage: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80"
  },

  // --- ブラジル ---
  {
    flag: "🇧🇷",
    country: "ブラジル",
    region: "リオデジャネイロ州",
    city: "リオデジャネイロ（アトランティカ大通り）",
    lat: -22.971964,
    lng: -43.182565,
    heading: 80,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80"
  },

  // --- アラブ首長国連邦 ---
  {
    flag: "🇦🇪",
    country: "アラブ首長国連邦",
    region: "ドバイ首長国",
    city: "ドバイ（シェイク・モハメド・ビン・ラシッド通り）",
    lat: 25.197197,
    lng: 55.274376,
    heading: 70,
    pitch: 35,
    demoImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80"
  },

  // --- タイ ---
  {
    flag: "🇹🇭",
    country: "タイ",
    region: "バンコク",
    city: "プラナコーン区（マハラート通り・王宮周辺）",
    lat: 13.743702,
    lng: 100.493026,
    heading: 260,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1600&q=80"
  },

  // --- シンガポール ---
  {
    flag: "🇸🇬",
    country: "シンガポール",
    region: "ダウンタウン・コア",
    city: "マリーナ・ベイ（ウォーターフロント・プロムナード）",
    lat: 1.286920,
    lng: 103.854570,
    heading: 110,
    pitch: 8,
    demoImage: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80"
  },

  // --- 台湾 ---
  {
    flag: "🇹🇼",
    country: "台湾",
    region: "新北市",
    city: "瑞芳区（九份・豎崎路階段街）",
    lat: 25.109867,
    lng: 121.845194,
    heading: 190,
    pitch: -10,
    demoImage: "https://images.unsplash.com/photo-1508247967583-7d982ea01526?auto=format&fit=crop&w=1600&q=80"
  },

  // --- 韓国 ---
  {
    flag: "🇰🇷",
    country: "韓国",
    region: "ソウル特別市",
    city: "鐘路区（北村路・韓屋村街道）",
    lat: 37.582604,
    lng: 126.983995,
    heading: 180,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1600&q=80"
  },

  // --- 南アフリカ ---
  {
    flag: "🇿🇦",
    country: "南アフリカ",
    region: "西ケープ州",
    city: "ケープタウン（タフェルベルク・ロード）",
    lat: -33.957314,
    lng: 18.403108,
    heading: 160,
    pitch: 15,
    demoImage: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1600&q=80"
  },

  // --- アイスランド ---
  {
    flag: "🇮🇸",
    country: "アイスランド",
    region: "南部地域",
    city: "スコゥガル（リングロード1号線）",
    lat: 63.532052,
    lng: -19.511380,
    heading: 0,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80"
  },

  // --- ペルー ---
  {
    flag: "🇵🇪",
    country: "ペルー",
    region: "クスコ県",
    city: "ウルバンバ郡（アグアス・カリエンテス山道）",
    lat: -13.163141,
    lng: -72.544963,
    heading: 10,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=80"
  }
];
