/* 关卡配置：只需增加 LEVELS 数组里的对象即可扩关。 */
const CATEGORIES = {
  drink:{name:"饮料",shelfName:"饮料区",color:"#4f9cf9"},
  snack:{name:"零食",shelfName:"零食区",color:"#f59e4b"},
  daily:{name:"日用品",shelfName:"日用品区",color:"#e2634f"}
};
const ITEMS = {
  wine:{category:"drink",name:"玻璃酒瓶"}, milk:{category:"drink",name:"牛奶盒"},
  soda:{category:"drink",name:"可乐"},
  cookie:{category:"snack",name:"曲奇饼干"}, croissant:{category:"snack",name:"牛角包"},
  tissue:{category:"daily",name:"卫生纸"},
  water:{category:"drink",name:"矿泉水"}, chips:{category:"snack",name:"薯片"},
  shampoo:{category:"daily",name:"洗发水"}, chocolate:{category:"snack",name:"巧克力"},
  orange_juice:{category:"drink",name:"橙汁"}, candy:{category:"snack",name:"糖果"},
  toothpaste:{category:"daily",name:"牙膏"}, coffee:{category:"drink",name:"咖啡"},
  instant_noodles:{category:"snack",name:"方便面"}, soap:{category:"daily",name:"香皂"},
  green_tea:{category:"drink",name:"绿茶"}, popcorn:{category:"snack",name:"爆米花"},
  detergent:{category:"daily",name:"洗衣液"}, facial_tissue:{category:"daily",name:"抽纸"}
};
// =================== 关卡编辑区 ===================
// 只在 LEVEL_CONFIGS 中增删改关卡，不需要修改游戏代码。
// counts: 商品种类和数量（商品名称在上方 ITEMS 注册）。
// columns: 每层货架的列数；depth: 每层货架前后排数。
// groupFillRatio: 每层货架希望横向占用的比例（0~1），实际受商品数、列容量限制。
// basketCapacity: 篮子最大件数；seed: 地面散落随机种子。
// wrongShelf: 初始错放商品；kind 为商品类型，layer 为货架类别，slot 为从0开始的槽位编号。
// groundLayout: 地面商品聚簇的中心点、半径等（坐标为百分比）。
// 每一关可以完全独立调整这些参数；新增关卡直接复制一个对象。
const LEVEL_CONFIGS = [
  {
    id:1, name:"初次整理",
    counts:{wine:2,milk:2,cookie:2,tissue:2},
    columns:4, depth:1, groupFillRatio:0.9, basketCapacity:3, seed:11,
    wrongShelf:[{kind:"tissue",layer:"drink",slot:1},{kind:"milk",layer:"snack",slot:2}],
    groundLayout:{centers:[[27,40],[65,48]],radiusBase:7,radiusStep:4,radiusCycle:3}
  },
  {
    id:2, name:"便利店大扫除",
    counts:{wine:5,milk:5,cookie:10,tissue:10},
    columns:10, depth:3, groupFillRatio:0.9, basketCapacity:5, seed:29,
    wrongShelf:[
      {kind:"tissue",layer:"drink",slot:0},{kind:"tissue",layer:"drink",slot:2},
      {kind:"cookie",layer:"drink",slot:4},{kind:"wine",layer:"snack",slot:1},
      {kind:"milk",layer:"snack",slot:3},{kind:"cookie",layer:"daily",slot:0}
    ],
    groundLayout:{centers:[[18,22],[45,24],[76,25],[26,62],[58,65],[81,69]],radiusBase:4,radiusStep:3.1,radiusCycle:5}
  },
  {
    id:3, name:"可乐补货日",
    counts:{wine:6,milk:6,soda:6,cookie:9,tissue:9},
    columns:10, depth:3, groupFillRatio:0.9, basketCapacity:5, seed:43,
    wrongShelf:[
      {kind:"tissue",layer:"drink",slot:0},{kind:"cookie",layer:"drink",slot:2},
      {kind:"tissue",layer:"drink",slot:4},{kind:"milk",layer:"snack",slot:0},
      {kind:"wine",layer:"snack",slot:2},{kind:"soda",layer:"snack",slot:4},
      {kind:"cookie",layer:"daily",slot:0},{kind:"milk",layer:"daily",slot:2}
    ],
    groundLayout:{centers:[[18,22],[45,24],[76,25],[26,62],[58,65],[81,69]],radiusBase:4,radiusStep:3.1,radiusCycle:5}
  },
  {
    id:4, name:"零食新上架",
    counts:{wine:7,milk:7,soda:8,cookie:7,croissant:7,tissue:6},
    columns:10, depth:3, groupFillRatio:0.9, basketCapacity:5, seed:61,
    wrongShelf:[
      {kind:"tissue",layer:"drink",slot:0},{kind:"cookie",layer:"drink",slot:2},
      {kind:"croissant",layer:"drink",slot:4},{kind:"milk",layer:"snack",slot:0},
      {kind:"wine",layer:"snack",slot:2},{kind:"soda",layer:"snack",slot:4},
      {kind:"cookie",layer:"daily",slot:0},{kind:"milk",layer:"daily",slot:2}
    ],
    groundLayout:{centers:[[18,22],[45,24],[76,25],[26,62],[58,65],[81,69]],radiusBase:4,radiusStep:3.1,radiusCycle:5}
  }
  ,{
    // 第5关策略谜题：3件饼干堵住牛奶目标位，3件纸巾堵住饼干目标位，
    // 3件牛奶堵住纸巾目标位。篮子仅3格，先拿满地上的牛奶会真实死局。
    // 解法示例：拿饮料架饼干→零食架纸巾→日用品架牛奶，
    // 依次归位牛奶→纸巾→饼干；随后清理剩余错放及地面商品。
    id:5, name:"货架连环堵塞",
    counts:{milk:3,wine:12,soda:12,cookie:3,croissant:9,tissue:3},
    columns:10, depth:3, groupFillRatio:0.9, basketCapacity:3, seed:79,
    wrongShelf:[
      // 牛奶独占饮料架第1列、3排：0、10、20，全部被饼干堵住
      {kind:"cookie",layer:"drink",slot:0},
      {kind:"cookie",layer:"drink",slot:10},
      {kind:"cookie",layer:"drink",slot:20},
      // 饼干独占零食架第1-3列：0、1、2，全部被纸巾堵住
      {kind:"tissue",layer:"snack",slot:0},
      {kind:"tissue",layer:"snack",slot:1},
      {kind:"tissue",layer:"snack",slot:2},
      // 纸巾独占日用品架第1-3列：0、1、2，全部被牛奶堵住
      {kind:"milk",layer:"daily",slot:0},
      {kind:"milk",layer:"daily",slot:1},
      {kind:"milk",layer:"daily",slot:2},
      // 额外3件牛角包错放，增加清理量，但不堵住循环的唯一突破方式
      {kind:"croissant",layer:"drink",slot:5},
      {kind:"croissant",layer:"drink",slot:6},
      {kind:"croissant",layer:"drink",slot:7}
    ],
    groundLayout:{centers:[[18,22],[45,24],[76,25],[26,62],[58,65],[81,69]],radiusBase:4,radiusStep:3.1,radiusCycle:5}
  }

  ,{
    // 第6关：大量整理，新增矿泉水（饮料区）。从策略关回归轻松整理。
    id:6, name:"矿泉水补货日",
    counts:{milk:7,wine:7,soda:7,water:7,cookie:7,croissant:7,tissue:8},
    columns:10, depth:4, groupFillRatio:0.9, basketCapacity:6, seed:97,
    wrongShelf:[
      {kind:"tissue",layer:"drink",slot:0},{kind:"cookie",layer:"drink",slot:3},
      {kind:"croissant",layer:"drink",slot:6},{kind:"milk",layer:"snack",slot:1},
      {kind:"water",layer:"snack",slot:4},{kind:"wine",layer:"daily",slot:0},
      {kind:"cookie",layer:"daily",slot:3},{kind:"soda",layer:"daily",slot:6}
    ],
    groundLayout:{centers:[[16,20],[42,18],[74,22],[22,58],[53,60],[83,65]],radiusBase:4,radiusStep:3.1,radiusCycle:5}
  },
  {
    // 第7关：商品扩充，新增薯片（零食区）。
    id:7, name:"薯片上架",
    counts:{milk:7,wine:7,soda:7,water:7,cookie:8,croissant:8,chips:7,tissue:7},
    columns:10, depth:4, groupFillRatio:0.9, basketCapacity:6, seed:113,
    wrongShelf:[
      {kind:"cookie",layer:"drink",slot:0},{kind:"chips",layer:"drink",slot:2},
      {kind:"tissue",layer:"drink",slot:5},{kind:"croissant",layer:"drink",slot:8},
      {kind:"milk",layer:"snack",slot:0},{kind:"water",layer:"snack",slot:3},
      {kind:"soda",layer:"snack",slot:6},{kind:"wine",layer:"daily",slot:1},
      {kind:"chips",layer:"daily",slot:4},{kind:"cookie",layer:"daily",slot:7}
    ],
    groundLayout:{centers:[[15,18],[40,24],[73,19],[19,56],[48,64],[80,64]],radiusBase:4,radiusStep:3.3,radiusCycle:6}
  },
  {
    // 第8关：复杂分类，新增洗发水（日用品区），三个货架均有多个种类。
    id:8, name:"日用品大分类",
    counts:{milk:7,wine:7,soda:7,water:7,cookie:8,croissant:8,chips:8,tissue:7,shampoo:7},
    columns:10, depth:4, groupFillRatio:0.9, basketCapacity:7, seed:131,
    wrongShelf:[
      {kind:"tissue",layer:"drink",slot:0},{kind:"shampoo",layer:"drink",slot:2},
      {kind:"chips",layer:"drink",slot:4},{kind:"cookie",layer:"drink",slot:7},
      {kind:"water",layer:"snack",slot:0},{kind:"milk",layer:"snack",slot:2},
      {kind:"soda",layer:"snack",slot:5},{kind:"shampoo",layer:"snack",slot:8},
      {kind:"wine",layer:"daily",slot:0},{kind:"cookie",layer:"daily",slot:2},
      {kind:"croissant",layer:"daily",slot:5},{kind:"chips",layer:"daily",slot:8}
    ],
    groundLayout:{centers:[[15,19],[39,18],[70,23],[22,57],[51,61],[81,63]],radiusBase:4,radiusStep:3.4,radiusCycle:6}
  },
  {
    // 第9关：密集堆叠，新增巧克力（零食区），10种商品74件。
    id:9, name:"密集堆叠大扫除",
    counts:{milk:7,wine:7,soda:7,water:7,cookie:7,croissant:7,chips:7,chocolate:7,tissue:9,shampoo:9},
    columns:10, depth:4, groupFillRatio:0.9, basketCapacity:7, seed:149,
    wrongShelf:[
      {kind:"chips",layer:"drink",slot:0},{kind:"chocolate",layer:"drink",slot:2},
      {kind:"shampoo",layer:"drink",slot:4},{kind:"tissue",layer:"drink",slot:7},
      {kind:"milk",layer:"snack",slot:0},{kind:"water",layer:"snack",slot:2},
      {kind:"soda",layer:"snack",slot:4},{kind:"wine",layer:"snack",slot:7},
      {kind:"cookie",layer:"daily",slot:0},{kind:"croissant",layer:"daily",slot:2},
      {kind:"chocolate",layer:"daily",slot:4},{kind:"chips",layer:"daily",slot:7},
      {kind:"soda",layer:"daily",slot:9},{kind:"tissue",layer:"snack",slot:9}
    ],
    groundLayout:{centers:[[17,20],[41,19],[74,20],[21,58],[51,61],[80,64]],radiusBase:3.5,radiusStep:3.1,radiusCycle:6}
  },
  {
    // 第10关：策略挑战②；74件 / 10种。策略链：milk → cookie → tissue（最后一类先归位）。
    id:10, name:"策略挑战②",
    counts:{"wine":10,"milk":3,"cookie":3,"tissue":3,"soda":10,"croissant":9,"water":9,"chips":9,"shampoo":9,"chocolate":9},
    columns:10, depth:5, groupFillRatio:0.85, basketCapacity:3, seed:319,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":0},{"kind":"cookie","layer":"drink","slot":10},{"kind":"cookie","layer":"drink","slot":20},{"kind":"tissue","layer":"snack","slot":0},{"kind":"tissue","layer":"snack","slot":10},{"kind":"tissue","layer":"snack","slot":20}],
    groundLayout:{centers:[[16,19],[43,21],[76,19],[22,59],[53,61],[82,63]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第11关：橙汁上架；84件 / 11种。普通整理关，错放商品可逐步清理。
    id:11, name:"橙汁上架",
    counts:{"wine":8,"milk":8,"cookie":8,"tissue":8,"soda":8,"croissant":8,"water":8,"chips":7,"shampoo":7,"chocolate":7,"orange_juice":7},
    columns:10, depth:6, groupFillRatio:0.9, basketCapacity:7, seed:336,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":3},{"kind":"wine","layer":"snack","slot":10},{"kind":"milk","layer":"daily","slot":17},{"kind":"tissue","layer":"drink","slot":26},{"kind":"shampoo","layer":"snack","slot":3},{"kind":"croissant","layer":"daily","slot":10},{"kind":"chips","layer":"drink","slot":20},{"kind":"soda","layer":"snack","slot":28},{"kind":"water","layer":"daily","slot":5},{"kind":"chocolate","layer":"drink","slot":16},{"kind":"orange_juice","layer":"snack","slot":24},{"kind":"wine","layer":"daily","slot":2},{"kind":"croissant","layer":"drink","slot":14},{"kind":"milk","layer":"snack","slot":22},{"kind":"cookie","layer":"daily","slot":1},{"kind":"tissue","layer":"drink","slot":15}],
    groundLayout:{centers:[[16,19],[43,21],[76,19],[22,59],[53,61],[82,63]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第12关：糖果大分类；94件 / 12种。普通整理关，错放商品可逐步清理。
    id:12, name:"糖果大分类",
    counts:{"wine":8,"milk":8,"cookie":8,"tissue":8,"soda":8,"croissant":8,"water":8,"chips":8,"shampoo":8,"chocolate":8,"orange_juice":7,"candy":7},
    columns:10, depth:6, groupFillRatio:0.9, basketCapacity:7, seed:353,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":6},{"kind":"wine","layer":"snack","slot":13},{"kind":"milk","layer":"daily","slot":20},{"kind":"candy","layer":"drink","slot":29},{"kind":"shampoo","layer":"snack","slot":6},{"kind":"croissant","layer":"daily","slot":13},{"kind":"tissue","layer":"drink","slot":23},{"kind":"soda","layer":"snack","slot":1},{"kind":"water","layer":"daily","slot":8},{"kind":"chips","layer":"drink","slot":19},{"kind":"orange_juice","layer":"snack","slot":28},{"kind":"chocolate","layer":"daily","slot":5},{"kind":"croissant","layer":"drink","slot":17},{"kind":"milk","layer":"snack","slot":26},{"kind":"wine","layer":"daily","slot":4},{"kind":"cookie","layer":"drink","slot":18},{"kind":"tissue","layer":"snack","slot":27},{"kind":"chocolate","layer":"daily","slot":7}],
    groundLayout:{centers:[[16,19],[43,21],[76,19],[22,59],[53,61],[82,63]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第13关：牙膏补货日；104件 / 13种。普通整理关，错放商品可逐步清理。
    id:13, name:"牙膏补货日",
    counts:{"wine":8,"milk":8,"cookie":8,"tissue":8,"soda":8,"croissant":8,"water":8,"chips":8,"shampoo":8,"chocolate":8,"orange_juice":8,"candy":8,"toothpaste":8},
    columns:10, depth:7, groupFillRatio:0.9, basketCapacity:8, seed:370,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":9},{"kind":"wine","layer":"snack","slot":16},{"kind":"milk","layer":"daily","slot":23},{"kind":"candy","layer":"drink","slot":2},{"kind":"shampoo","layer":"snack","slot":9},{"kind":"croissant","layer":"daily","slot":16},{"kind":"tissue","layer":"drink","slot":27},{"kind":"soda","layer":"snack","slot":4},{"kind":"water","layer":"daily","slot":11},{"kind":"chips","layer":"drink","slot":23},{"kind":"orange_juice","layer":"snack","slot":1},{"kind":"chocolate","layer":"daily","slot":8},{"kind":"toothpaste","layer":"drink","slot":21},{"kind":"milk","layer":"snack","slot":0},{"kind":"wine","layer":"daily","slot":7},{"kind":"cookie","layer":"drink","slot":22},{"kind":"toothpaste","layer":"snack","slot":3},{"kind":"chocolate","layer":"daily","slot":10},{"kind":"chips","layer":"drink","slot":26},{"kind":"tissue","layer":"snack","slot":8}],
    groundLayout:{centers:[[16,19],[43,21],[76,19],[22,59],[53,61],[82,63]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第14关：复杂混乱大扫除；114件 / 14种。普通整理关，错放商品可逐步清理。
    id:14, name:"复杂混乱大扫除",
    counts:{"wine":9,"milk":9,"cookie":8,"tissue":8,"soda":8,"croissant":8,"water":8,"chips":8,"shampoo":8,"chocolate":8,"orange_juice":8,"candy":8,"toothpaste":8,"coffee":8},
    columns:10, depth:8, groupFillRatio:0.9, basketCapacity:8, seed:387,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":12},{"kind":"wine","layer":"snack","slot":19},{"kind":"milk","layer":"daily","slot":26},{"kind":"candy","layer":"drink","slot":5},{"kind":"shampoo","layer":"snack","slot":12},{"kind":"croissant","layer":"daily","slot":19},{"kind":"tissue","layer":"drink","slot":0},{"kind":"soda","layer":"snack","slot":7},{"kind":"water","layer":"daily","slot":14},{"kind":"chips","layer":"drink","slot":27},{"kind":"orange_juice","layer":"snack","slot":4},{"kind":"chocolate","layer":"daily","slot":11},{"kind":"toothpaste","layer":"drink","slot":25},{"kind":"coffee","layer":"snack","slot":3},{"kind":"wine","layer":"daily","slot":10},{"kind":"cookie","layer":"drink","slot":26},{"kind":"milk","layer":"snack","slot":6},{"kind":"chocolate","layer":"daily","slot":13},{"kind":"chips","layer":"drink","slot":1},{"kind":"tissue","layer":"snack","slot":11},{"kind":"soda","layer":"daily","slot":18},{"kind":"croissant","layer":"drink","slot":8}],
    groundLayout:{centers:[[16,19],[43,21],[76,19],[22,59],[53,61],[82,63]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第15关：策略挑战③；114件 / 14种。策略链：milk → cookie → tissue → chocolate（最后一类先归位）。
    id:15, name:"策略挑战③",
    counts:{"wine":11,"milk":3,"cookie":3,"tissue":3,"soda":11,"croissant":10,"water":10,"chips":10,"shampoo":10,"chocolate":3,"orange_juice":10,"candy":10,"toothpaste":10,"coffee":10},
    columns:10, depth:10, groupFillRatio:0.85, basketCapacity:3, seed:404,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":0},{"kind":"cookie","layer":"drink","slot":10},{"kind":"cookie","layer":"drink","slot":20},{"kind":"tissue","layer":"snack","slot":0},{"kind":"tissue","layer":"snack","slot":10},{"kind":"tissue","layer":"snack","slot":20},{"kind":"chocolate","layer":"daily","slot":0},{"kind":"chocolate","layer":"daily","slot":10},{"kind":"chocolate","layer":"daily","slot":20}],
    groundLayout:{centers:[[16,19],[43,21],[76,19],[22,59],[53,61],[82,63]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第16关：方便面上架；126件 / 15种。普通整理关，错放商品可逐步清理。
    id:16, name:"方便面上架",
    counts:{"wine":9,"milk":9,"cookie":9,"tissue":9,"soda":9,"croissant":9,"water":8,"chips":8,"shampoo":8,"chocolate":8,"orange_juice":8,"candy":8,"toothpaste":8,"coffee":8,"instant_noodles":8},
    columns:10, depth:10, groupFillRatio:0.9, basketCapacity:9, seed:421,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":18},{"kind":"wine","layer":"snack","slot":25},{"kind":"instant_noodles","layer":"daily","slot":2},{"kind":"candy","layer":"drink","slot":11},{"kind":"shampoo","layer":"snack","slot":18},{"kind":"croissant","layer":"daily","slot":26},{"kind":"tissue","layer":"drink","slot":6},{"kind":"milk","layer":"snack","slot":13},{"kind":"soda","layer":"daily","slot":21},{"kind":"chips","layer":"drink","slot":3},{"kind":"orange_juice","layer":"snack","slot":10},{"kind":"chocolate","layer":"daily","slot":18},{"kind":"toothpaste","layer":"drink","slot":2},{"kind":"water","layer":"snack","slot":9},{"kind":"coffee","layer":"daily","slot":17},{"kind":"cookie","layer":"drink","slot":5},{"kind":"wine","layer":"snack","slot":12},{"kind":"milk","layer":"daily","slot":20},{"kind":"tissue","layer":"drink","slot":10},{"kind":"soda","layer":"snack","slot":17},{"kind":"croissant","layer":"daily","slot":25},{"kind":"chips","layer":"drink","slot":17},{"kind":"water","layer":"snack","slot":24},{"kind":"candy","layer":"daily","slot":3}],
    groundLayout:{centers:[[15,18],[40,20],[72,18],[18,55],[47,61],[79,61],[32,39],[66,42]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第17关：香皂补货日；138件 / 16种。普通整理关，错放商品可逐步清理。
    id:17, name:"香皂补货日",
    counts:{"wine":9,"milk":9,"cookie":9,"tissue":9,"soda":9,"croissant":9,"water":9,"chips":9,"shampoo":9,"chocolate":9,"orange_juice":8,"candy":8,"toothpaste":8,"coffee":8,"instant_noodles":8,"soap":8},
    columns:10, depth:11, groupFillRatio:0.9, basketCapacity:9, seed:438,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":21},{"kind":"wine","layer":"snack","slot":28},{"kind":"instant_noodles","layer":"daily","slot":5},{"kind":"candy","layer":"drink","slot":14},{"kind":"shampoo","layer":"snack","slot":21},{"kind":"croissant","layer":"daily","slot":29},{"kind":"tissue","layer":"drink","slot":9},{"kind":"milk","layer":"snack","slot":16},{"kind":"soda","layer":"daily","slot":24},{"kind":"soap","layer":"drink","slot":6},{"kind":"orange_juice","layer":"snack","slot":13},{"kind":"chips","layer":"daily","slot":21},{"kind":"chocolate","layer":"drink","slot":5},{"kind":"water","layer":"snack","slot":12},{"kind":"coffee","layer":"daily","slot":20},{"kind":"toothpaste","layer":"drink","slot":8},{"kind":"wine","layer":"snack","slot":15},{"kind":"chocolate","layer":"daily","slot":23},{"kind":"chips","layer":"drink","slot":13},{"kind":"tissue","layer":"snack","slot":20},{"kind":"milk","layer":"daily","slot":28},{"kind":"cookie","layer":"drink","slot":20},{"kind":"soda","layer":"snack","slot":27},{"kind":"croissant","layer":"daily","slot":6},{"kind":"shampoo","layer":"drink","slot":29},{"kind":"water","layer":"snack","slot":6}],
    groundLayout:{centers:[[15,18],[40,20],[72,18],[18,55],[47,61],[79,61],[32,39],[66,42]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第18关：绿茶与爆米花；154件 / 18种。普通整理关，错放商品可逐步清理。
    id:18, name:"绿茶与爆米花",
    counts:{"wine":9,"milk":9,"cookie":9,"tissue":9,"soda":9,"croissant":9,"water":9,"chips":9,"shampoo":9,"chocolate":9,"orange_juice":8,"candy":8,"toothpaste":8,"coffee":8,"instant_noodles":8,"soap":8,"green_tea":8,"popcorn":8},
    columns:10, depth:12, groupFillRatio:0.9, basketCapacity:9, seed:455,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":24},{"kind":"wine","layer":"snack","slot":1},{"kind":"instant_noodles","layer":"daily","slot":8},{"kind":"candy","layer":"drink","slot":17},{"kind":"shampoo","layer":"snack","slot":25},{"kind":"croissant","layer":"daily","slot":2},{"kind":"tissue","layer":"drink","slot":12},{"kind":"milk","layer":"snack","slot":20},{"kind":"green_tea","layer":"daily","slot":28},{"kind":"soap","layer":"drink","slot":9},{"kind":"orange_juice","layer":"snack","slot":17},{"kind":"chips","layer":"daily","slot":25},{"kind":"chocolate","layer":"drink","slot":8},{"kind":"soda","layer":"snack","slot":16},{"kind":"water","layer":"daily","slot":24},{"kind":"popcorn","layer":"drink","slot":11},{"kind":"toothpaste","layer":"snack","slot":19},{"kind":"coffee","layer":"daily","slot":27},{"kind":"chips","layer":"drink","slot":16},{"kind":"tissue","layer":"snack","slot":24},{"kind":"wine","layer":"daily","slot":3},{"kind":"cookie","layer":"drink","slot":23},{"kind":"milk","layer":"snack","slot":2},{"kind":"soda","layer":"daily","slot":11},{"kind":"shampoo","layer":"drink","slot":2},{"kind":"water","layer":"snack","slot":11},{"kind":"croissant","layer":"daily","slot":20},{"kind":"chocolate","layer":"drink","slot":19}],
    groundLayout:{centers:[[15,18],[40,20],[72,18],[18,55],[47,61],[79,61],[32,39],[66,42]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第19关：全商品大扫除；170件 / 20种。普通整理关，错放商品可逐步清理。
    id:19, name:"全商品大扫除",
    counts:{"wine":9,"milk":9,"cookie":9,"tissue":9,"soda":9,"croissant":9,"water":9,"chips":9,"shampoo":9,"chocolate":9,"orange_juice":8,"candy":8,"toothpaste":8,"coffee":8,"instant_noodles":8,"soap":8,"green_tea":8,"popcorn":8,"detergent":8,"facial_tissue":8},
    columns:10, depth:12, groupFillRatio:0.9, basketCapacity:10, seed:472,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":27},{"kind":"detergent","layer":"snack","slot":4},{"kind":"instant_noodles","layer":"daily","slot":11},{"kind":"candy","layer":"drink","slot":20},{"kind":"shampoo","layer":"snack","slot":28},{"kind":"croissant","layer":"daily","slot":5},{"kind":"tissue","layer":"drink","slot":15},{"kind":"facial_tissue","layer":"snack","slot":23},{"kind":"green_tea","layer":"daily","slot":1},{"kind":"soap","layer":"drink","slot":12},{"kind":"orange_juice","layer":"snack","slot":20},{"kind":"chips","layer":"daily","slot":29},{"kind":"chocolate","layer":"drink","slot":11},{"kind":"milk","layer":"snack","slot":19},{"kind":"wine","layer":"daily","slot":28},{"kind":"popcorn","layer":"drink","slot":14},{"kind":"toothpaste","layer":"snack","slot":22},{"kind":"coffee","layer":"daily","slot":2},{"kind":"chips","layer":"drink","slot":19},{"kind":"soda","layer":"snack","slot":27},{"kind":"water","layer":"daily","slot":8},{"kind":"cookie","layer":"drink","slot":26},{"kind":"wine","layer":"snack","slot":5},{"kind":"milk","layer":"daily","slot":16},{"kind":"shampoo","layer":"drink","slot":5},{"kind":"water","layer":"snack","slot":14},{"kind":"soda","layer":"daily","slot":25},{"kind":"tissue","layer":"drink","slot":22},{"kind":"green_tea","layer":"snack","slot":1},{"kind":"croissant","layer":"daily","slot":13}],
    groundLayout:{centers:[[15,18],[40,20],[72,18],[18,55],[47,61],[79,61],[32,39],[66,42]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  },
  {
    // 第20关：策略挑战④；170件 / 20种。策略链：milk → cookie → tissue → chocolate → detergent（最后一类先归位）。
    id:20, name:"策略挑战④",
    counts:{"wine":11,"milk":3,"cookie":3,"tissue":3,"soda":11,"croissant":11,"water":11,"chips":11,"shampoo":10,"chocolate":3,"orange_juice":10,"candy":10,"toothpaste":10,"coffee":10,"instant_noodles":10,"soap":10,"green_tea":10,"popcorn":10,"detergent":3,"facial_tissue":10},
    columns:10, depth:12, groupFillRatio:0.85, basketCapacity:3, seed:489,
    wrongShelf:[{"kind":"cookie","layer":"drink","slot":0},{"kind":"cookie","layer":"drink","slot":10},{"kind":"cookie","layer":"drink","slot":20},{"kind":"tissue","layer":"snack","slot":0},{"kind":"tissue","layer":"snack","slot":10},{"kind":"tissue","layer":"snack","slot":20},{"kind":"chocolate","layer":"daily","slot":0},{"kind":"chocolate","layer":"daily","slot":10},{"kind":"chocolate","layer":"daily","slot":20},{"kind":"detergent","layer":"snack","slot":5},{"kind":"detergent","layer":"snack","slot":15},{"kind":"detergent","layer":"snack","slot":25}],
    groundLayout:{centers:[[15,18],[40,20],[72,18],[18,55],[47,61],[79,61],[32,39],[66,42]],radiusBase:3.2,radiusStep:2.9,radiusCycle:7}
  }
];
// =================== 关卡编辑区结束 ===================

function makeLevel({id,name,counts,columns,depth,groupFillRatio=0.9,basketCapacity,wrongShelf=[],groundLayout,seed}) {
  const products=[];let n=0;
  for(const [kind,count] of Object.entries(counts))for(let i=0;i<count;i++){
    products.push({id:`P${id}_${++n}`,kind,...ITEMS[kind]});
  }
  const layers=["drink","snack","daily"].map(category=>({category,columns,depth}));
  // 由配置表生成初始错放，保留每一关原有错放的具体商品和槽位。
  const shelf=layers.map(()=>Array(columns*depth).fill(null));
  const occupied=new Set();
  for (const placement of wrongShelf) {
    const li=layers.findIndex(layer=>layer.category===placement.layer);
    if(li<0)throw Error(`第${id}关：未知货架 ${placement.layer}`);
    if(!Number.isInteger(placement.slot)||placement.slot<0||placement.slot>=columns*depth)
      throw Error(`第${id}关：错放槽位越界 ${placement.slot}`);
    if(shelf[li][placement.slot]!==null)throw Error(`第${id}关：错放槽位重复`);
    const product=products.find(p=>p.kind===placement.kind&&!occupied.has(p.id));
    if(!product)throw Error(`第${id}关：错放商品 ${placement.kind} 数量不足`);
    if(product.category===placement.layer)throw Error(`第${id}关：初始商品必须错放`);
    shelf[li][placement.slot]=product.id;
    occupied.add(product.id);
  }
  const remaining=products.filter(p=>!occupied.has(p.id));
  const ground=remaining.map((p,i)=>{
    // 多簇重叠堆叠：商品围绕少数中心散落，产生遮挡；上层拾走后下层逐渐显露。
    // 用确定性坐标保证重玩稳定，并避免全体商品均匀铺成网格。
    const centers = groundLayout.centers;
    const cluster = centers[(i*5+seed)%centers.length];
    const angle = (i*137.508+seed*19)*Math.PI/180;
    const radius = groundLayout.radiusBase+(i%groundLayout.radiusCycle)*groundLayout.radiusStep;
    const x = Math.max(4,Math.min(91,cluster[0]+Math.cos(angle)*radius));
    const y = Math.max(6,Math.min(83,cluster[1]+Math.sin(angle)*radius*.78));
    return {id:p.id,x,y,rot:((i*47+seed*13)%161)-80};
  });
  return {id,name,basketCapacity,groupFillRatio,layers,categories:CATEGORIES,products,initial:{shelf,ground,basket:[]}};
}
function validateLevelConfig(config) {
  const {id,counts,columns,depth,groupFillRatio,basketCapacity,groundLayout}=config;
  if(!Number.isInteger(id)||id<1)throw Error("关卡 id 必须为正整数");
  if(!Number.isInteger(columns)||columns<1||!Number.isInteger(depth)||depth<1)throw Error(`第${id}关：货架行列必须为正整数`);
  if(!(groupFillRatio>0&&groupFillRatio<=1))throw Error(`第${id}关：groupFillRatio 必须在 (0,1] 之间`);
  if(!Number.isInteger(basketCapacity)||basketCapacity<1)throw Error(`第${id}关：篮子容量必须为正整数`);
  if(!groundLayout||!Array.isArray(groundLayout.centers)||!groundLayout.centers.length)throw Error(`第${id}关：地面聚簇配置缺失`);
  for(const [kind,count] of Object.entries(counts)){
    if(!ITEMS[kind])throw Error(`第${id}关：未知商品 ${kind}`);
    if(!Number.isInteger(count)||count<0)throw Error(`第${id}关：商品数量无效 ${kind}`);
  }
  for(const category of Object.keys(CATEGORIES)){
    const kinds=Object.keys(counts).filter(k=>ITEMS[k].category===category&&counts[k]>0);
    const needed=kinds.reduce((sum,k)=>sum+Math.ceil(counts[k]/depth),0);
    if(needed>columns)throw Error(`第${id}关：${category} 至少需要 ${needed} 列，货架只有 ${columns} 列`);
  }
}
const LEVELS=LEVEL_CONFIGS.map(config=>{validateLevelConfig(config);return makeLevel(config);});
if(new Set(LEVELS.map(l=>l.id)).size!==LEVELS.length)throw Error("关卡 id 不可重复");
const LEVEL_1=LEVELS[0];
if(typeof module!=="undefined"&&module.exports)module.exports={LEVELS,LEVEL_1,LEVEL_CONFIGS,makeLevel,validateLevelConfig};
if(typeof globalThis!=="undefined"){globalThis.LEVELS=LEVELS;globalThis.LEVEL_1=LEVEL_1;}
