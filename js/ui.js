/* =========================================================
 * UI 层：DOM 构建、统一坐标系定位、动画编排、输入处理
 * 依赖：level.js（LEVEL_1）、game.js（Game）
 * ========================================================= */

(() => {
  "use strict";

  const game = Game;
  let level = LEVELS[0];
  let levelIndex = 0;

  /* ---------- DOM 引用 ---------- */
  const els = {
    game: document.getElementById("game"),
    homeScreen: document.getElementById("home-screen"),
    btnHome: document.getElementById("btn-home"),
    btnHomePlay: document.getElementById("btn-home-play"),
    btnHomeLevels: document.getElementById("btn-home-levels"),
    btnHomeHelp: document.getElementById("btn-home-help"),
    shelf: document.getElementById("shelf"),
    groundZone: document.getElementById("ground-zone"),
    basket: document.getElementById("basket"),
    basketSlots: document.getElementById("basket-slots"),
    basketCount: document.getElementById("basket-count"),
    productsLayer: document.getElementById("products-layer"),
    toast: document.getElementById("toast"),
    progressFill: document.getElementById("progress-fill"),
    progressText: document.getElementById("progress-text"),
    helpOverlay: document.getElementById("help-overlay"),
    winOverlay: document.getElementById("win-overlay"),
    stuckOverlay: document.getElementById("stuck-overlay"),
    btnHelp: document.getElementById("btn-help"),
    btnLevelJump: document.getElementById("btn-level-jump"),
    levelJumpOverlay: document.getElementById("level-jump-overlay"),
    levelJumpList: document.getElementById("level-jump-list"),
    btnLevelJumpClose: document.getElementById("btn-level-jump-close"),
    btnHelpClose: document.getElementById("btn-help-close"),
    btnRestart: document.getElementById("btn-restart"),
    btnStuckRestart: document.getElementById("btn-stuck-restart"),
    btnNext: document.getElementById("btn-next"),
    levelTitle: document.getElementById("level-title")
  };

  const layerEls = [];   // [层号] -> 层元素
  const anchorEls = [];  // [层号][槽号] -> 锚点元素
  const bslotEls = [];   // [篮子槽] -> 元素
  const productEls = {}; // id -> 商品元素

  /* 布局缓存（相对 #game 的坐标） */
  const layout = { anchors: [], ground: null, bslots: [], pw: 50, ph: 62 };

  let busy = false;          // 动画期间的输入锁：避免拾取/放置重复触发
  let toastTimer = null;

  const STAG = 130;  // 批量归位的起飞间隔
  const FLIGHT = 400;// 单件飞行时长

  /* ---------- 工具 ---------- */

  function hexToRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 460);
  }

  function showToast(text) {
    els.toast.textContent = text;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1600);
  }

  function popBasketCount() {
    els.basketCount.classList.add("pop");
    setTimeout(() => els.basketCount.classList.remove("pop"), 220);
  }

  /* 第一批已确认的 3D 卡通商品图片；独立透明素材，不再依赖包装文字 SVG。 */
  function productArt(p) {
    const known = new Set(["wine", "milk", "soda", "cookie", "croissant", "tissue", "water", "chips", "shampoo", "chocolate", "orange_juice", "candy", "toothpaste", "coffee", "instant_noodles", "soap", "green_tea", "popcorn", "detergent", "facial_tissue"]);
    return `assets/${known.has(p.kind) ? p.kind : "milk"}.png`;
  }

  /* ---------- 静态结构构建 ---------- */

  function buildStatic() {
    els.shelf.innerHTML="";els.basketSlots.innerHTML="";els.productsLayer.innerHTML="";
    layerEls.length=0;anchorEls.length=0;bslotEls.length=0;
    Object.keys(productEls).forEach(k=>delete productEls[k]);
    // 货架层
    level.layers.forEach((L, i) => {
      const cat = level.categories[L.category];
      const layerEl = document.createElement("div");
      layerEl.className = "layer";
      layerEl.style.setProperty("--cat", cat.color);
      layerEl.style.setProperty("--cat-glow", hexToRgba(cat.color, 0.38));
      // 后期关卡纵深增加时压缩排间视觉偏移，避免商品穿出当前货架。
      layerEl.style.setProperty("--depth-step", `${Math.min(7, 28 / Math.max(1, L.depth - 1)).toFixed(2)}px`);
      layerEl.addEventListener("click", () => { if (!busy) trySelectLayer(i); });

      const slots = document.createElement("div");
      slots.className = "shelf-depth";
      slots.style.setProperty("--columns", L.columns);
      slots.style.setProperty("--depth", L.depth);
      const row = [];
      for (let d = L.depth - 1; d >= 0; d--) {
        const depthRow = document.createElement("div");
        depthRow.className = "shelf-slots depth-row depth-"+d;
        depthRow.style.setProperty("--columns",L.columns);
        depthRow.style.setProperty("--row-depth",d);
        for(let j=0;j<L.columns;j++){
          const a=document.createElement("div");a.className="anchor";
          a.appendChild(Object.assign(document.createElement("div"),{className:"glow"}));
          depthRow.appendChild(a);row[d*L.columns+j]=a;
        }
        slots.appendChild(depthRow);
      }
      const board = document.createElement("div");
      board.className = "board";
      const label = document.createElement("div");
      label.className = "label";
      label.innerHTML =
        `<span class="dot"></span><span class="name">${cat.shelfName}</span><span class="full-chip">已满</span>`;

      // 分类铭牌放在本层商品上方，建立“标签—商品”的直接对应关系。
      layerEl.append(label, slots, board);
      els.shelf.appendChild(layerEl);
      layerEls.push(layerEl);
      anchorEls.push(row);
    });

    // 篮子槽位
    for (let i = 0; i < level.basketCapacity; i++) {
      const b = document.createElement("div");
      b.className = "bslot";
      els.basketSlots.appendChild(b);
      bslotEls.push(b);
    }

    // 商品（挂在统一坐标系浮层上，方便跨区域飞行动画）
    // 视觉为独立 PNG 商品素材，保留原来的 DOM 位置和飞行动画
    level.products.forEach(p => {
      const cat = level.categories[p.category];
      const el = document.createElement("div");
      el.className = "product";
      el.dataset.id = p.id;
      el.style.setProperty("--cat", cat.color);
      el.style.setProperty("--cat-glow", hexToRgba(cat.color, 0.45));
      if (p.tag) el.style.setProperty("--tag", p.tag);
      el.innerHTML = `<div class="card"><img class="product-art" src="${productArt(p)}" alt="${p.name}" draggable="false"></div>`;
      el.addEventListener("click", e => {
        e.stopPropagation();
        if (!busy) onProductClick(p.id);
      });
      els.productsLayer.appendChild(el);
      productEls[p.id] = el;
    });

    // 覆盖层按钮
  }

  function bindControls(){
    // 开发测试选关：根据 LEVELS 自动生成，新增/删除关卡无需改这里。
    els.levelJumpList.replaceChildren();
    LEVELS.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-jump-item";
      btn.textContent = `第 ${item.id} 关 · ${item.name}`;
      btn.addEventListener("click", () => {
        els.homeScreen.classList.add("hidden");
        levelIndex = index;
        els.levelJumpOverlay.classList.add("hidden");
        els.helpOverlay.classList.add("hidden");
        els.winOverlay.classList.add("hidden");
        els.stuckOverlay.classList.add("hidden");
        clearTimeout(toastTimer);
        els.toast.classList.remove("show");
        loadLevel();
      });
      els.levelJumpList.appendChild(btn);
    });
    els.btnHome.addEventListener("click", () => {
      if (busy) { showToast("请等待商品整理动画结束"); return; }
      els.levelJumpOverlay.classList.add("hidden");
      els.helpOverlay.classList.add("hidden");
      els.winOverlay.classList.add("hidden");
      els.stuckOverlay.classList.add("hidden");
      els.homeScreen.classList.remove("hidden");
    });
    els.btnHomePlay.addEventListener("click", () => {
      els.homeScreen.classList.add("hidden");
      levelIndex = 0;
      loadLevel();
    });
    els.btnHomeLevels.addEventListener("click", () => els.levelJumpOverlay.classList.remove("hidden"));
    els.btnHomeHelp.addEventListener("click", () => els.helpOverlay.classList.remove("hidden"));
    els.btnLevelJump.addEventListener("click", () => els.levelJumpOverlay.classList.remove("hidden"));
    els.btnLevelJumpClose.addEventListener("click", () => els.levelJumpOverlay.classList.add("hidden"));
    els.btnHelp.addEventListener("click", () => els.helpOverlay.classList.remove("hidden"));
    els.btnHelpClose.addEventListener("click", () => els.helpOverlay.classList.add("hidden"));
    els.btnRestart.addEventListener("click", start);
    els.btnStuckRestart.addEventListener("click", start);
    els.btnNext.addEventListener("click",()=>{if(levelIndex<LEVELS.length-1){levelIndex++;loadLevel();}});
    els.game.addEventListener("click", e => {
      if (busy) return;
      if (game.snapshot().selectedLayer === null) return;
      if (e.target.closest(".layer") || e.target.closest(".product")) return;
      game.deselectLayer();
      renderPass();
    });
  }

  /* ---------- 布局测量 ---------- */

  function computeLayout() {
    const g = els.game.getBoundingClientRect();
    layout.pw = anchorEls[0][0].offsetWidth;
    layout.ph = anchorEls[0][0].offsetHeight;
    layout.anchors = anchorEls.map(row => row.map(a => {
      const r = a.getBoundingClientRect();
      return { x: r.left - g.left, y: r.top - g.top };
    }));
    const gr = els.groundZone.getBoundingClientRect();
    layout.ground = { x: gr.left - g.left, y: gr.top - g.top, w: gr.width, h: gr.height };
    layout.bslots = bslotEls.map(b => {
      const r = b.getBoundingClientRect();
      return {
        x: r.left - g.left + (r.width - layout.pw) / 2,
        y: r.top - g.top + (r.height - layout.ph) / 2
      };
    });
  }

  // 货架姿态：正确 = 立正对齐陈列（回到槽位网格）；
  // 错位 = 大幅偏移、多样倾角、缩放微差、堆叠层级 —— 脱离"一格一格"的摆放感
  function shelfPose(id) {
    const p = game.product(id);
    const row = layout.anchors[p.loc.layer];
    const a = row[p.loc.slot];
    const columns=level.layers[p.loc.layer].columns;
    const depth=Math.floor(p.loc.slot/columns);
    if (level.layers[p.loc.layer].category === p.category) {
      return {
        x: a.x + p.pose.correctDX * layout.pw,
        y: a.y,
        rot: p.pose.correctRot,
        scale: 1,
        z: 40 - depth * 8
      };
    }
    // 错位商品不再局限在自己的槽位内：允许横跨相邻槽位、上下挤压。
    // 逻辑位置仍然保留在原 slot，只有视觉坐标发生变化，因此不影响规则判定。
    let x = a.x + p.pose.messDX * layout.pw;
    const edgePadding = layout.pw * 0.18;
    const first=row[depth*columns],last=row[depth*columns+columns-1];
    x = Math.max(first.x - edgePadding,Math.min(x,last.x + edgePadding));
    return {
      x,
      y: a.y + p.pose.messDY * layout.ph,
      rot: p.pose.messRot,
      scale: p.pose.messScale,
      z: p.pose.messZ + 30 - depth * 8
    };
  }

  // 将错位商品实际显示的中心位置映射到最近的视觉陈列格。
  // 只修正「能否归位」的占位判断，不移动商品、不改其原始逻辑 slot。
  function syncVisualOccupancy() {
    const snap = game.snapshot();
    const blocked = snap.layers.map(() => []);
    snap.layers.forEach((layer, li) => {
      const cols = layer.columns;
      layer.slots.forEach((id, slot) => {
        if (id === null) return;
        const p = game.product(id);
        // 已经整理正确的商品，沿用原本逻辑占位，避免误伤相邻紧密商品。
        if (p.category === layer.category) return;
        const pose = shelfPose(id);
        const depth = Math.floor(slot / cols);
        const anchors = layout.anchors[li];
        const visualCenter = pose.x + layout.pw / 2;
        let closest = depth * cols;
        let distance = Infinity;
        for (let c = 0; c < cols; c++) {
          const candidate = depth * cols + c;
          const d = Math.abs(visualCenter - (anchors[candidate].x + layout.pw / 2));
          if (d < distance) { distance = d; closest = candidate; }
        }
        blocked[li].push(closest);
      });
    });
    game.setVisualBlockedSlots(blocked);
    return blocked;
  }

  function setPose(el, x, y, rot, scale, z) {
    let t = `translate(${x}px, ${y}px)`;
    if (rot) t += ` rotate(${rot}deg)`;
    if (scale && scale !== 1) t += ` scale(${scale})`;
    el.style.transform = t;
    el.style.zIndex = z;
  }

  /* ---------- 渲染 ---------- */

  // 状态同步（不改坐标）：层选中/置灰/满载、空位高亮、篮中高亮、计数、进度
  function renderPass() {
    const visuallyBlocked = syncVisualOccupancy();
    const snap = game.snapshot();
    const sel = snap.selectedLayer;
    const selCat = sel !== null ? snap.layers[sel].category : null;
    const selHasFree = sel !== null && snap.layers[sel].slots.includes(null);

    layerEls.forEach((el, i) => {
      const L = snap.layers[i];
      el.classList.toggle("full", !L.slots.includes(null));
      el.classList.toggle("selected", sel === i);
      el.classList.toggle("dimmed", sel !== null && sel !== i);
      L.slots.forEach((s, j) => anchorEls[i][j].classList.toggle("free", s === null && !visuallyBlocked[i].includes(j)));
    });

    level.products.forEach(def => {
      const el = productEls[def.id];
      const p = game.product(def.id);
      // 选中某层时：其他层的货架商品置灰
      el.classList.toggle("dim",
        sel !== null && p.loc.type === "shelf" && p.loc.layer !== sel);
      // 篮中与选中层同类的商品高亮；不同类弱化（仍可临时错位放置）
      const inBasket = p.loc.type === "basket";
      el.classList.toggle("match", inBasket && sel !== null && def.category === selCat && selHasFree);
      el.classList.toggle("nomatch", inBasket && sel !== null && !(def.category === selCat && selHasFree));
    });

    els.basketCount.textContent = snap.basket.length + "/" + snap.capacity;
    els.basketCount.classList.toggle("full", snap.basket.length >= snap.capacity);

    els.progressFill.style.width = Math.round(snap.correctCount / snap.total * 100) + "%";
    els.progressText.textContent = snap.correctCount + "/" + snap.total;
  }

  // 坐标同步：按 loc 把每件商品摆到正确位置（instant=true 时无动画，用于开局/重开/resize）
  function renderPositions(instant) {
    if (instant) els.productsLayer.classList.add("no-anim");
    const snap = game.snapshot();
    const groundMap = {};
    snap.ground.forEach(g => { groundMap[g.id] = g; });

    level.products.forEach(def => {
      const p = game.product(def.id);
      const el = productEls[def.id];
      let pose;

      if (p.loc.type === "shelf") {
        pose = shelfPose(def.id);
        const isMessy = level.layers[p.loc.layer].category !== p.category;
        el.classList.toggle("messy", isMessy);
        el.dataset.messType = isMessy ? p.pose.messType : "none";
        el.classList.remove("loc-ground", "loc-basket");
        el.classList.add("loc-shelf");
      } else if (p.loc.type === "ground") {
        el.classList.remove("messy");
        el.dataset.messType = "none";
        // 地面：按关卡散落参数 + 堆叠缩放/层级（互相叠压的杂乱感）
        const g = groundMap[def.id];
        const gr = layout.ground;
        pose = {
          x: gr.x + (gr.w - layout.pw) * g.x / 100,
          y: gr.y + (gr.h - layout.ph) * g.y / 100,
          rot: g.rot,
          scale: p.pose.messScale,
          z: p.pose.messZ
        };
        el.classList.remove("loc-shelf", "loc-basket");
        el.classList.add("loc-ground");
      } else {
        el.classList.remove("messy");
        el.dataset.messType = "none";
        const i = snap.basket.indexOf(def.id);
        const b = layout.bslots[Math.max(0, Math.min(i, layout.bslots.length - 1))];
        pose = { x: b.x, y: b.y, rot: 0, scale: 1, z: 20 };
        el.classList.remove("loc-shelf", "loc-ground");
        el.classList.add("loc-basket");
      }

      setPose(el, pose.x, pose.y, pose.rot, pose.scale, pose.z);
    });

    if (instant) {
      void els.productsLayer.offsetWidth; // 强制回流，确保无动画生效
      requestAnimationFrame(() => els.productsLayer.classList.remove("no-anim"));
    }
  }

  /* ---------- 输入分流 ---------- */

  function onProductClick(id) {
    const p = game.product(id);
    if (p.loc.type === "basket") tryPlace(id);
    else tryPickUp(id);
  }

  /* ---------- 拾取 ---------- */

  function tryPickUp(id) {
    const r = game.pickUp(id);
    if (!r.ok) {
      // 点击"其他位置"（非可拾取商品）：迅速退出货架高亮
      if (game.snapshot().selectedLayer !== null) {
        game.deselectLayer();
        renderPass();
      }
      if (r.reason === "basket-full") {
        shake(els.basket);
        showToast("篮子已满，先归位一些商品吧");
      } else if (r.reason === "locked") {
        // 已正确归位的商品固定不动：轻微晃动提示
        const el = productEls[id];
        el.classList.remove("locked");
        void el.offsetWidth;
        el.classList.add("locked");
        setTimeout(() => el.classList.remove("locked"), 460);
        showToast("这件已正确归位，固定不动");
      }
      return;
    }

    busy = true;
    game.deselectLayer(); // 拾取视为"其他位置"操作：快速退出货架高亮
    const el = productEls[id];
    el.classList.remove("loc-shelf", "loc-ground", "messy");
    el.dataset.messType = "none";
    el.classList.add("loc-basket", "flying");
    const t = layout.bslots[r.basketIndex];
    el.style.zIndex = 60; // 飞行置顶
    el.style.transform = `translate(${t.x}px, ${t.y}px)`;
    renderPass();      // 计数、空位、高亮即时同步
    popBasketCount();

    setTimeout(() => {
      el.classList.remove("flying");
      el.style.zIndex = 20; // 篮中层级
      busy = false;
      // 拾取后不立刻弹死局：先让玩家尝试归位，并看见占位原因。
    }, FLIGHT + 30);
  }

  /* ---------- 选中货架层 ---------- */

  function trySelectLayer(i) {
    const sel = game.snapshot().selectedLayer;
    const r = game.selectLayer(i);
    if (!r.ok) {
      if (r.reason === "layer-full") {
        shake(layerEls[i]);
        showToast("货架位置已被其他商品占据，先清理货架");
        // 点击已满的其他层也视为"其他位置"：迅速退出当前高亮
        if (sel !== null && sel !== i) {
          game.deselectLayer();
          renderPass();
        }
      }
      return;
    }
    renderPass();
  }

  /* ---------- 从篮子放置 ---------- */

  function tryPlace(id) {
    syncVisualOccupancy();
    const r = game.placeFromBasket(id);
    if (!r.ok) {
      if (r.reason === "no-layer-selected") {
        showToast("先点击选择一个货架层");
      } else if (r.reason === "target-blocked" || r.reason === "layer-full") {
        const sel = game.snapshot().selectedLayer;
        if (sel !== null) shake(layerEls[sel]);
        showToast("货架位置已被其他商品占据，先清理货架");
        // 先显示原因，再判定是否真正无路可走。
        setTimeout(() => checkStuck(), 1700);
      } else if (r.reason === "wrong-category") {
        // 点击了不匹配的商品：货架震动，然后退出高亮
        const sel = game.snapshot().selectedLayer;
        game.deselectLayer();
        if (sel !== null) shake(layerEls[sel]);
        renderPass();
        showToast("这件商品不属于这一层");
      }
      return;
    }

    // 同批归位中只要有商品因目标位置被占据而跳过，就明确提示。
    if (r.skipped && r.skipped.length) {
      showToast("部分商品的位置已被其他商品占据，暂时无法归位");
    }
    busy = true;
    const clicked = productEls[id];
    clicked.classList.add("chosen");
    setTimeout(() => clicked.classList.remove("chosen"), 240);

    // 整批抬起（放大 + 阴影），随后逐件起飞
    r.placed.forEach(pl => productEls[pl.id].classList.add("flying"));
    renderPass();

    // 篮中剩余商品滑到新槽位
    const snap = game.snapshot();
    snap.basket.forEach((bid, i) => {
      const t = layout.bslots[i];
      productEls[bid].style.transform = `translate(${t.x}px, ${t.y}px)`;
    });

    // 逐件飞入货架（飞行期间置顶，落地回到归位层 z=9）
    r.placed.forEach((pl, k) => {
      const pel = productEls[pl.id];
      setTimeout(() => {
        const pose = shelfPose(pl.id);
        pel.style.zIndex = 60; // 飞行置顶
        pel.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg) scale(${pose.scale})`;
      }, k * STAG);
      setTimeout(() => {
        pel.classList.remove("flying");
        pel.classList.remove("loc-basket");
        pel.classList.add("loc-shelf");
        pel.style.zIndex = shelfPose(pl.id).z; // 按前后排恢复遮挡顺序
        const card = pel.firstElementChild;
        card.classList.add("settle");
        setTimeout(() => card.classList.remove("settle"), 380);
      }, k * STAG + FLIGHT);
    });

    // 收尾：解锁输入、检查通关/僵局（成功放置货架不震动）
    const total = (r.placed.length - 1) * STAG + FLIGHT + 160;
    setTimeout(() => {
      busy = false;
      if (game.snapshot().won) winSequence();
      else if (r.skipped && r.skipped.length) {
        // 保证玩家有时间看到占位提示，再展示真正的死局。
        setTimeout(() => checkStuck(), 550);
      } else checkStuck();
    }, total);
  }

  /* ---------- 通关 / 僵局 ---------- */

  function winSequence() {
    busy = true;
    renderPass();
    layerEls.forEach((el, i) => {
      setTimeout(() => el.classList.add("wave"), 200 + i * 140);
    });
    setTimeout(() => {
      els.btnNext.hidden = levelIndex >= LEVELS.length-1;
      els.winOverlay.classList.remove("hidden");
    }, 1250);
  }

  function checkStuck() {
    if (game.snapshot().won) return;
    if (!game.hasAnyMove()) {
      els.stuckOverlay.classList.remove("hidden");
    }
  }

  /* ---------- 开局 / 重开 ---------- */

  function start() {
    game.newGame(level);
    els.levelTitle.textContent=`第 ${level.id} 关 · ${level.name}`;
    els.btnNext.hidden=levelIndex>=LEVELS.length-1;
    layerEls.forEach(el => el.classList.remove("wave", "shake"));
    Object.values(productEls).forEach(el => {
      el.classList.remove("flying", "chosen");
      const card = el.firstElementChild;
      card.classList.remove("settle");
    });
    els.winOverlay.classList.add("hidden");
    els.stuckOverlay.classList.add("hidden");
    busy = false;
    renderPositions(true);
    renderPass();
  }

  /* ---------- 启动 ---------- */

  function loadLevel(){level=LEVELS[levelIndex];buildStatic();computeLayout();start();requestAnimationFrame(()=>{computeLayout();renderPositions(true);});}
  bindControls();
  loadLevel();
  // 首次进入显示首页，玩法说明由首页按钮打开。

  // 布局稳定后校准一次（字体/视口高度可能引起微小变化）
  requestAnimationFrame(() => { computeLayout(); renderPositions(true); });
  window.addEventListener("load", () => { computeLayout(); renderPositions(true); });

  let resizeRAF = null;
  window.addEventListener("resize", () => {
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(() => {
      computeLayout();
      renderPositions(true);
    });
  });
})();
