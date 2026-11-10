/* =========================================================
 * 核心玩法逻辑（纯数据与规则，不依赖 DOM）
 *
 * 规则要点：
 * - 拾取：点击货架或地面上"错位/散落"的商品放入篮子（篮子有容量上限，满了不可拾取）；
 *   已正确归位的商品会被固定，无法再次拾取
 * - 放置：必须先选中一个有空位的货架层；点击篮中与该层同类的商品，
 *   篮中同类会全部自动飞入，直至该层摆满；点击非同类商品会被拒绝
 * - 每次成功放置后自动取消选中，回到正常状态
 * - 通关：全部商品都在正确类别的货架层，且地面与篮子清空
 * ========================================================= */

const Game = (() => {

  let state = null;
  // UI 按商品当前屏幕位置计算的视觉占位；不改变商品位置或原始 slot。
  let visualBlocked = [];
  function setVisualBlockedSlots(blocked) {
    visualBlocked = blocked.map(slots => new Set(slots));
  }

  /* ---------- 工具 ---------- */

  // 由商品 id 生成稳定的凌乱姿态。
  // 注意：这些参数只影响 UI 的视觉位置，不改变商品真实所属的 layer/slot。
  // 通过不同强度的姿态 + 更大的横纵偏移，让商品跨槽位挤压、倾倒和局部堆叠。
  // 同一 id 每次开局姿态一致，避免重开或 resize 时发生视觉抖动。
  function poseFromId(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;

    // 简单的确定性伪随机数：同一商品始终得到相同姿态。
    let seed = (h * 9301 + 49297) % 233280;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const signed = () => rand() * 2 - 1;

    // 四档凌乱程度：轻微歪斜 / 明显错位 / 倾倒 / 局部堆叠。
    const tier = h % 10;
    let messType, angleMin, angleMax, offsetX, offsetY, scaleMin, scaleMax, zBase;
    if (tier <= 1) {
      [messType, angleMin, angleMax, offsetX, offsetY, scaleMin, scaleMax, zBase] =
        ["light", 18, 38, 0.34, 0.16, 0.94, 1.02, 12];
    } else if (tier <= 5) {
      [messType, angleMin, angleMax, offsetX, offsetY, scaleMin, scaleMax, zBase] =
        ["medium", 38, 72, 0.56, 0.23, 0.92, 1.07, 16];
    } else if (tier <= 8) {
      [messType, angleMin, angleMax, offsetX, offsetY, scaleMin, scaleMax, zBase] =
        ["heavy", 72, 108, 0.68, 0.27, 0.91, 1.08, 20];
    } else {
      [messType, angleMin, angleMax, offsetX, offsetY, scaleMin, scaleMax, zBase] =
        ["pile", 48, 96, 0.74, 0.30, 0.98, 1.10, 24];
    }

    const angle = angleMin + rand() * (angleMax - angleMin);
    return {
      messType,
      messRot: (rand() < 0.5 ? -1 : 1) * angle,
      // 以槽位宽高为单位，允许商品明显跨越相邻槽位。
      messDX: signed() * offsetX,
      messDY: signed() * offsetY,
      messScale: scaleMin + rand() * (scaleMax - scaleMin),
      // 前景商品覆盖后景商品，制造真实的遮挡关系。
      messZ: zBase + Math.floor(rand() * 5),
      correctRot: ((h * 3) % 5) - 2,
      correctDX: (((h * 11) % 7) - 3) / 100
    };
  }

  // 篮内商品槽位序号刷新（篮子内商品顺序变化后保持 loc.index 一致）
  function reindexBasket() {
    state.basket.forEach((id, i) => {
      state.products[id].loc = { type: "basket", index: i };
    });
  }

  function recompute() {
    let correct = 0;
    for (const id in state.products) {
      const p = state.products[id];
      if (p.loc.type === "shelf" && state.layers[p.loc.layer].category === p.category) correct++;
    }
    state.correctCount = correct;
    // 通关判定
    state.won =
      correct === state.total &&
      state.basket.length === 0 &&
      state.ground.length === 0;
  }

  /* ---------- 开局 ---------- */

  function newGame(level) {
    visualBlocked = [];
    const layers = level.layers.map(L => ({
      category: L.category,
      columns: L.columns, depth: L.depth, slots: new Array(L.columns * L.depth).fill(null)
    }));

    const products = {};
    level.products.forEach(p => {
      products[p.id] = {
        ...p,
        pose: poseFromId(p.id),
        loc: { type: "basket", index: -1 } // 先占位，下面按初始局面赋值
      };
    });

    const ground = [];

    // 初始货架
    level.initial.shelf.forEach((row, li) => {
      row.forEach((id, si) => {
        if (id === null) return;
        layers[li].slots[si] = id;
        products[id].loc = { type: "shelf", layer: li, slot: si };
      });
    });

    // 初始地面（保留散落视觉参数）
    level.initial.ground.forEach(g => {
      ground.push({ id: g.id, x: g.x, y: g.y, rot: g.rot });
      products[g.id].loc = { type: "ground" };
    });

    const basket = [...(level.initial.basket || [])];
    basket.forEach((id,i)=>{products[id].loc={type:"basket",index:i};});
    state = {
      level,
      products,
      layers,
      ground,          // [{id,x,y,rot}]
      basket,          // [productId]
      selectedLayer: null,
      correctCount: 0,
      total: level.products.length,
      won: false,
      capacity: level.basketCapacity
    };

    recompute();
    return snapshot();
  }

  /* ---------- 查询 ---------- */

  function snapshot() {
    return {
      layers: state.layers.map(L => ({ category: L.category, columns:L.columns, depth:L.depth, slots: [...L.slots] })),
      basket: [...state.basket],
      ground: state.ground.map(g => ({ ...g })),
      selectedLayer: state.selectedLayer,
      correctCount: state.correctCount,
      total: state.total,
      won: state.won,
      capacity: state.capacity
    };
  }

  function product(id) { return state.products[id]; }

  function freeSlots(layerIndex) {
    const out = [];
    state.layers[layerIndex].slots.forEach((s, i) => { if (s === null) out.push(i); });
    return out;
  }

  // 同类商品独占连续的列，按前排到后排填充。
  // 先按该类别各商品数量和纵深计算列宽，再为每组划定独立列区域。
  // 例如 depth=4、牛奶6件：牛奶独占2列，填满最前面3排，后排留空。
  // 只更改正确商品的目标槽位，不调整商品尺寸、货架视觉坐标或初始摆放。
  function targetSlotsForKind(kind) {
    const p = state.level.products.find(item => item.kind === kind);
    if (!p) return [];
    const li = layerIndexForCategory(p.category);
    if (li < 0) return [];
    const layer = state.layers[li];
    const kinds = [...new Set(state.level.products
      .filter(item => item.category === p.category).map(item => item.kind))];
    if (p.category === "drink") {
      const preferred = ["milk", "wine"];
      kinds.sort((a,b) => {
        const ai = preferred.indexOf(a), bi = preferred.indexOf(b);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      });
    }
    const counts = Object.fromEntries(kinds.map(k => [k,
      state.level.products.filter(item => item.kind === k).length]));
    const widths = Object.fromEntries(kinds.map(k => [k,
      Math.ceil(counts[k] / layer.depth)]));
    const minimumColumns = kinds.reduce((sum,k) => sum + widths[k], 0);
    if (minimumColumns > layer.columns) {
      throw Error(`货架 ${p.category} 分组列数不足：需要 ${minimumColumns} 列，只有 ${layer.columns} 列`);
    }
    // 先满足每种商品的最小列宽，再根据本关 groupFillRatio 横向扩展。
    // 每种商品最多占用其商品数量对应的列数，避免分配纯空列。
    const ratio = state.level.groupFillRatio ?? 0.9;
    const desiredColumns = Math.min(layer.columns,
      Math.max(minimumColumns, Math.ceil(layer.columns * ratio)),
      kinds.reduce((sum,k)=>sum+counts[k],0));
    let totalColumns = minimumColumns;
    while(totalColumns < desiredColumns){
      const candidates=kinds.filter(k=>widths[k]<counts[k]);
      if(!candidates.length)break;
      // 尽量按商品数量比例分配额外列宽，保证各组相对均衡。
      candidates.sort((a,b)=>(counts[b]/widths[b])-(counts[a]/widths[a]) || kinds.indexOf(a)-kinds.indexOf(b));
      widths[candidates[0]]++;
      totalColumns++;
    }
    if (totalColumns > layer.columns) {
      throw Error(`货架 ${p.category} 分组列数不足：需要 ${totalColumns} 列，只有 ${layer.columns} 列`);
    }
    const startColumn = kinds.slice(0, kinds.indexOf(kind))
      .reduce((sum,k) => sum + widths[k], 0);
    const result = [];
    // 每排从左到右，先填最前排（depth=0），再逐排向后。
    for (let depth=0; depth<layer.depth && result.length<counts[kind]; depth++) {
      for (let col=0; col<widths[kind] && result.length<counts[kind]; col++) {
        result.push(depth * layer.columns + startColumn + col);
      }
    }
    return result;
  }

  function freeTargetSlots(kind) {
    const p = Object.values(state.products).find(item=>item.kind===kind);
    if (!p) return [];
    const li = layerIndexForCategory(p.category);
    return targetSlotsForKind(kind).filter(slot=>
      state.layers[li].slots[slot]===null && !(visualBlocked[li] && visualBlocked[li].has(slot)));
  }

  function layerIndexForCategory(cat) {
    return state.layers.findIndex(L => L.category === cat);
  }

  // 篮中商品是否可以放入当前选中的层（用于高亮判定）
  function canPlaceInSelectedLayer(id) {
    if (state.selectedLayer === null) return false;
    const layer = state.layers[state.selectedLayer];
    return state.products[id].category === layer.category && freeTargetSlots(state.products[id].kind).length > 0;
  }

  /* ---------- 操作：拾取 ---------- */

  function pickUp(id) {
    if (state.won) return { ok: false, reason: "finished" };
    const p = state.products[id];
    if (!p) return { ok: false, reason: "not-found" };
    if (p.loc.type === "basket") return { ok: false, reason: "already-in-basket" };
    // 已正确归位的商品被固定，不可再次拾取
    if (p.loc.type === "shelf" && state.layers[p.loc.layer].category === p.category) {
      return { ok: false, reason: "locked" };
    }
    if (state.basket.length >= state.capacity) return { ok: false, reason: "basket-full" };

    const from = { ...p.loc };

    if (p.loc.type === "shelf") {
      state.layers[p.loc.layer].slots[p.loc.slot] = null;
    }
    // ground 的视觉参数保留在 state.ground 里，移除即腾空
    if (p.loc.type === "ground") {
      state.ground = state.ground.filter(g => g.id !== id);
    }

    state.basket.push(id);
    reindexBasket();
    recompute();
    return { ok: true, id, from, basketIndex: state.basket.length - 1 };
  }

  /* ---------- 操作：选中货架层 ---------- */

  function selectLayer(index) {
    if (state.won) return { ok: false, reason: "finished" };
    if (index < 0 || index >= state.layers.length) return { ok: false, reason: "bad-index" };
    if (state.selectedLayer === index) {
      state.selectedLayer = null; // 再次点击取消选中
      return { ok: true, selected: false, index };
    }
    if (freeSlots(index).length === 0) return { ok: false, reason: "layer-full", index };
    state.selectedLayer = index;
    return { ok: true, selected: true, index };
  }

  function deselectLayer() {
    state.selectedLayer = null;
  }

  /* ---------- 操作：从篮子放置 ---------- */

  function placeFromBasket(id) {
    if (state.won) return { ok: false, reason: "finished" };
    const p = state.products[id];
    if (!p || p.loc.type !== "basket") return { ok: false, reason: "not-in-basket" };
    if (state.selectedLayer === null) return { ok: false, reason: "no-layer-selected" };

    const layerIdx = state.selectedLayer;
    const layer = state.layers[layerIdx];
    // 点击了与选中层不同类的商品：拒绝（由 UI 触发货架震动并退出选中）
    if (p.category !== layer.category) return { ok: false, reason: "wrong-category" };

    // 同类别不同商品按固定目标区域归位：牛奶与酒瓶不会交错。
    // 如果某种商品的目标格被错位商品占据，则仅该商品暂时不能放入；
    // 不改其他商品的归位能力，也不自动挪动已整理的商品。
    const ids = [id, ...state.basket.filter(pid =>
      pid !== id && state.products[pid].category === layer.category)];
    const placed = [];
    const skipped = [];
    for (const pid of ids) {
      const slots = freeTargetSlots(state.products[pid].kind);
      if (!slots.length) { skipped.push(pid); continue; }
      const slot = slots[0];
      layer.slots[slot] = pid;
      state.basket = state.basket.filter(b => b !== pid);
      state.products[pid].loc = { type: "shelf", layer: layerIdx, slot };
      placed.push({ id: pid, slot, correct: true });
    }
    if (placed.length === 0) return { ok: false, reason: "target-blocked", skipped };
    const n = placed.length;

    reindexBasket(); // 篮内剩余商品槽位序号刷新

    // 每次放置后自动取消选中，回到正常状态
    state.selectedLayer = null;

    recompute();
    return {
      ok: true,
      layer: layerIdx,
      placed,
      bulk: n > 1,
      remainingInBasket: ids.length - n,
      skipped
    };
  }

  /* ---------- 防御性检查 ---------- */

  // 僵局检测：篮子已满且篮中任何商品都放不进其归属层（无空位），
  // 同时无法拾取任何商品 → 没有可行操作。此时应由 UI 提示重开。
  function hasAnyMove() {
    if (state.won) return false;
    if (state.basket.length < state.capacity) {
      // 还能拾取：地面上有商品，或货架上有错位商品
      const pickable =
        state.ground.length > 0 ||
        state.layers.some((L, li) =>
          L.slots.some(s => s !== null && state.products[s].category !== L.category));
      if (pickable) return true;
    }
    if (state.basket.length > 0) {
      // 篮中有商品且其归属层还有空位 → 可以放置
      return state.basket.some(id =>
        freeTargetSlots(state.products[id].kind).length > 0);
    }
    return false;
  }

  // 数据完整性校验（供自动化测试）：无复制/丢失/重叠占位，篮子不超限
  function validate() {
    const errors = [];
    const seen = new Set();

    state.layers.forEach((L, li) => {
      if(L.slots.length!==L.columns*L.depth)errors.push(`货架 ${li} 容量不一致`);
      L.slots.forEach((s, si) => {
        if (s === null) return;
        if (seen.has(s)) errors.push(`商品 ${s} 重复占位`);
        seen.add(s);
        if (state.products[s].loc.type !== "shelf" ||
            state.products[s].loc.layer !== li ||
            state.products[s].loc.slot !== si) {
          errors.push(`商品 ${s} 的 loc 与层 ${li} 槽 ${si} 不一致`);
        }
      });
    });

    state.ground.forEach(g => {
      if (seen.has(g.id)) errors.push(`商品 ${g.id} 重复占位（地面）`);
      seen.add(g.id);
      if (state.products[g.id].loc.type !== "ground") errors.push(`商品 ${g.id} 的 loc 与地面不一致`);
    });

    state.basket.forEach((id, bi) => {
      if (seen.has(id)) errors.push(`商品 ${id} 重复占位（篮子）`);
      seen.add(id);
      if (state.products[id].loc.type !== "basket" || state.products[id].loc.index !== bi) {
        errors.push(`商品 ${id} 的 loc 与篮子槽 ${bi} 不一致`);
      }
    });

    if (seen.size !== state.total) errors.push(`商品总数 ${seen.size} ≠ ${state.total}（丢失或复制）`);
    if (state.basket.length > state.capacity) errors.push(`篮子超限：${state.basket.length}/${state.capacity}`);
    const freeCount = state.layers.reduce((a, L) => a + L.slots.filter(s => s === null).length, 0);
    if (freeCount < state.ground.length + state.basket.length) {
      errors.push(`剩余货架容量不足：空位 ${freeCount}，待整理 ${state.ground.length+state.basket.length}`);
    }
    return { ok: errors.length === 0, errors };
  }

  return {
    newGame,
    snapshot,
    product,
    freeSlots,
    setVisualBlockedSlots,
    layerIndexForCategory,
    canPlaceInSelectedLayer,
    pickUp,
    selectLayer,
    deselectLayer,
    placeFromBasket,
    hasAnyMove,
    validate
  };
})();

// 兼容浏览器 <script> 与 Node（供自动化验证）
if (typeof module !== "undefined" && module.exports) module.exports = Game;
if (typeof globalThis !== "undefined") globalThis.Game = Game;
