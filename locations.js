/**
 * 世界中のストリートビュー対応地点データベース
 * 有名観光地から、何気ない生活風景、ローカルな裏路地、大自然の街道まで網羅
 */
const WORLD_LOCATIONS = [
  // =========================================================================
  // 日本 - 観光地からローカルな生活街道まで
  // =========================================================================
  {
    flag: "🇯🇵",
    country: "日本",
    region: "東京都",
    city: "台東区（谷中・レトロな下町路地）",
    lat: 35.726500,
    lng: 139.767200,
    heading: 180,
    pitch: 0,
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
    region: "長野県",
    city: "木曽郡南木曽町（妻籠宿・旧中山道）",
    lat: 35.576500,
    lng: 137.595000,
    heading: 45,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "広島県",
    city: "尾道市（千光寺山麓の坂道・階段街）",
    lat: 34.409500,
    lng: 133.197000,
    heading: 160,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "北海道",
    city: "上川郡美瑛町（パッチワークの路・丘陵地帯）",
    lat: 43.605000,
    lng: 142.450000,
    heading: 230,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "沖縄県",
    city: "国頭郡本部町（備瀬フクギ並木・海岸集落）",
    lat: 26.702758,
    lng: 127.879133,
    heading: 270,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "富山県",
    city: "高岡市（雨晴海岸・海沿いのローカル街道）",
    lat: 36.809000,
    lng: 137.039000,
    heading: 40,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇯🇵",
    country: "日本",
    region: "愛媛県",
    city: "今治市（しまなみ海道・大三島の海沿い小道）",
    lat: 34.250000,
    lng: 133.000000,
    heading: 120,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // アメリカ - 荒野の一本道、広大なハイウェイ、地方都市
  // =========================================================================
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "アリゾナ州",
    city: "セリグマン近郊（旧ルート66の荒野街道）",
    lat: 35.325800,
    lng: -112.876500,
    heading: 250,
    pitch: 2,
    demoImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "ユタ州",
    city: "モニュメントバレー近郊（国道163号線直線道路）",
    lat: 37.101500,
    lng: -109.990800,
    heading: 215,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "カリフォルニア州",
    city: "ビッグサー（太平洋岸パシフィック・コースト・ハイウェイ）",
    lat: 36.371000,
    lng: -121.901000,
    heading: 160,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "オレゴン州",
    city: "ポートランド郊外（静かな住宅街の緑道）",
    lat: 45.515200,
    lng: -122.678400,
    heading: 90,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "ハワイ州",
    city: "ハワイ島（キラウエア溶岩地帯を貫くハイウェイ）",
    lat: 19.310000,
    lng: -155.200000,
    heading: 180,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇺🇸",
    country: "アメリカ合衆国",
    region: "ニューヨーク州",
    city: "ブルックリン（ダンボ・石畳の街角）",
    lat: 40.703300,
    lng: -73.989600,
    heading: 340,
    pitch: 10,
    demoImage: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // イギリス - 伝統的な農村、海岸の村、地方の生活路
  // =========================================================================
  {
    flag: "🇬🇧",
    country: "イギリス",
    region: "ウィルトシャー",
    city: "カースル・クーム（コッツウォルズの小さな川沿いの村）",
    lat: 51.493000,
    lng: -2.228000,
    heading: 190,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇬🇧",
    country: "イギリス",
    region: "スコットランド",
    city: "ハイランド地方（スカイ島の荒野と断崖道路）",
    lat: 57.535000,
    lng: -6.220000,
    heading: 140,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // フランス - ワイン畑の道、中世の村、海岸プロムナード
  // =========================================================================
  {
    flag: "🇫🇷",
    country: "フランス",
    region: "グラン・テスト",
    city: "オー＝ラン県（エギスハイムの円形中世小道）",
    lat: 48.042500,
    lng: 7.306000,
    heading: 110,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇫🇷",
    country: "フランス",
    region: "ブルゴーニュ＝フランシュ＝コンテ",
    city: "ボーヌ近郊（広大なブドウ畑を抜ける農道）",
    lat: 47.025000,
    lng: 4.835000,
    heading: 260,
    pitch: 2,
    demoImage: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // イタリア - トスカーナの並木道、地中海の漁村、田舎街道
  // =========================================================================
  {
    flag: "🇮🇹",
    country: "イタリア",
    region: "トスカーナ州",
    city: "シエーナ県（糸杉が連なる丘陵の田舎道）",
    lat: 43.080000,
    lng: 11.620000,
    heading: 180,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇮🇹",
    country: "イタリア",
    region: "シチリア州",
    city: "タオルミーナ山腹（地中海を見下ろすワインディングロード）",
    lat: 37.852000,
    lng: 15.285000,
    heading: 130,
    pitch: -5,
    demoImage: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // スペイン - アンダルシアの白い村、メセタの大地
  // =========================================================================
  {
    flag: "🇪🇸",
    country: "スペイン",
    region: "アンダルシア州",
    city: "マラガ県（フリヒリアナ・白い壁と石畳の路地）",
    lat: 36.790000,
    lng: -3.895000,
    heading: 350,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇪🇸",
    country: "スペイン",
    region: "カスティーリャ＝ラ・マンチャ州",
    city: "トレド郊外（風車が並ぶ丘陵道路）",
    lat: 39.460000,
    lng: -3.610000,
    heading: 210,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // ドイツ - 黒い森、バイエルン農村
  // =========================================================================
  {
    flag: "🇩🇪",
    country: "ドイツ",
    region: "バーデン＝ヴュルテンベルク州",
    city: "シュヴァルツヴァルト（黒い森の木漏れ日街道）",
    lat: 48.300000,
    lng: 8.200000,
    heading: 90,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // スイス - アルプスの峠道、山あいの牧草地
  // =========================================================================
  {
    flag: "🇨🇭",
    country: "スイス",
    region: "ヴァレー州",
    city: "フルカ峠（アルプスを越える大パノラマ道路）",
    lat: 46.572000,
    lng: 8.415000,
    heading: 260,
    pitch: 5,
    demoImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇨🇭",
    country: "スイス",
    region: "ベルン州",
    city: "グリンデルヴァルト（アイガー北壁を仰ぐ山道）",
    lat: 46.624000,
    lng: 8.041000,
    heading: 170,
    pitch: 15,
    demoImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // 北欧 - 海を渡る橋、フィヨルド、極北の街道
  // =========================================================================
  {
    flag: "🇳🇴",
    country: "ノルウェー",
    region: "ムーレ・オ・ロムスダール県",
    city: "アトランティック・オーシャン・ロード（大西洋架橋道路）",
    lat: 63.017000,
    lng: 7.355000,
    heading: 320,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇮🇸",
    country: "アイスランド",
    region: "東部地域",
    city: "リングロード1号線（フィヨルドと黒砂海岸の道）",
    lat: 64.950000,
    lng: -14.200000,
    heading: 60,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // オーストラリア & ニュージーランド - アウトバック、沿岸ハイウェイ
  // =========================================================================
  {
    flag: "🇦🇺",
    country: "オーストラリア",
    region: "ノーザンテリトリー",
    city: "スチュアート・ハイウェイ（果てしないアウトバック赤土直線道路）",
    lat: -24.500000,
    lng: 133.500000,
    heading: 0,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇳🇿",
    country: "ニュージーランド",
    region: "カンタベリー地方",
    city: "テカポ湖畔（サザンアルプスを望むカントリーロード）",
    lat: -43.880000,
    lng: 170.520000,
    heading: 300,
    pitch: 2,
    demoImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // アジア - 田園の一本道、海沿いの街道、市場路地
  // =========================================================================
  {
    flag: "🇹🇼",
    country: "台湾",
    region: "台東県",
    city: "池上郷（伯朗大道・電柱のない緑の水田一本道）",
    lat: 23.118000,
    lng: 121.218000,
    heading: 260,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1508247967583-7d982ea01526?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇹🇭",
    country: "タイ",
    region: "チェンマイ県",
    city: "メーリム郡（緑豊かな山あいの農村街道）",
    lat: 18.915000,
    lng: 98.860000,
    heading: 190,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇰🇷",
    country: "韓国",
    region: "済州特別自治道",
    city: "西帰浦市（黒い玄武岩と海沿いの風車道路）",
    lat: 33.250000,
    lng: 126.550000,
    heading: 90,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1600&q=80"
  },

  // =========================================================================
  // アフリカ & 南米 - 砂漠横断路、サバンナ、アンデス山道
  // =========================================================================
  {
    flag: "🇿🇦",
    country: "南アフリカ",
    region: "西ケープ州",
    city: "チャップマンズ・ピーク・ドライブ（断崖絶壁の海岸道路）",
    lat: -34.088000,
    lng: 18.360000,
    heading: 190,
    pitch: -2,
    demoImage: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇦🇷",
    country: "アルゼンチン",
    region: "サンタクルス州",
    city: "ルタ40（パタゴニアの強風吹き抜ける荒野ハイウェイ）",
    lat: -49.300000,
    lng: -71.800000,
    heading: 270,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80"
  },
  {
    flag: "🇨🇱",
    country: "チリ",
    region: "アントファガスタ州",
    city: "アタカマ砂漠（世界で最も乾燥した砂漠の直線道路）",
    lat: -23.500000,
    lng: -69.800000,
    heading: 180,
    pitch: 0,
    demoImage: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=80"
  }
];
