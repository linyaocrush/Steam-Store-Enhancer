  function addStyle() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        '.sapx-extra-price{margin-left:6px;font-size:0.9em;opacity:1;white-space:nowrap;pointer-events:none;color:#67c1f5;display:inline-block;font-weight:normal;text-decoration:none!important}' +
        '.sapx-extra-price::before,.sapx-extra-price::after{content:none!important;display:none!important}' +
        '.sapx-region-locked{display:inline-block;margin-left:6px;color:#e46767!important;font-size:0.9em;font-weight:700;white-space:nowrap;pointer-events:none}' +
        'strike .sapx-extra-price,.discount_original_price .sapx-extra-price,.StoreOriginalPrice .sapx-extra-price{opacity:0.65;font-size:0.85em;color:#acb2b8;text-decoration:none!important}' +
        '#sapx-cart-summary{margin-top:8px;margin-bottom:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);color:#c6d4df;font-size:12px;line-height:1.4}' +
        '#sapx-cart-summary .sapx-row{display:flex;justify-content:space-between;gap:8px;align-items:center}' +
        '#sapx-cart-summary .sapx-label{font-size:11px;opacity:0.8;color:#acb2b8}' +
        '#sapx-cart-summary .sapx-value{font-weight:700;white-space:nowrap;color:#67c1f5;font-size:14px}' +
        '#sapx-cart-summary .sapx-warn{margin-top:4px;color:#e46767;font-size:10px;opacity:0.9}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price{text-decoration:none!important}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price::before,.game_purchase_action_bg .discount_prices .discount_original_price::after{content:none!important;display:none!important}' +
        '.game_purchase_action_bg .discount_prices .discount_original_price .sapx-extra-price{text-decoration:none!important}' +
        '#sse-game-hover{position:fixed;z-index:1200;box-sizing:border-box;margin:0;color:#20354a;background:#dce6ed;border-radius:6px;box-shadow:0 5px 22px #0009;font:13px/1.45 Arial,sans-serif;white-space:normal;overflow-wrap:anywhere}' +
        '#sse-game-hover[hidden]{display:none}' +
        '#sse-game-hover .sse-game-hover-body{box-sizing:border-box;overflow:auto;overscroll-behavior:contain;padding:12px 14px;border-radius:inherit}' +
        '#sse-game-hover .sse-game-hover-body>div+div{margin-top:5px}' +
        '#sse-game-hover .sse-game-hover-title{margin-bottom:8px;color:#132839;font-size:15px;font-weight:700}' +
        '#sse-game-hover .sse-game-hover-tags{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}' +
        '#sse-game-hover .sse-game-hover-tags span{padding:1px 5px;border-radius:3px;background:#b9cfdf;color:#20354a;font-size:12px}' +
        '#sse-game-hover[data-side="left"]::after{content:"";position:absolute;left:calc(100% - 6px);top:var(--sse-game-hover-arrow);width:12px;height:12px;background:inherit;transform:translateY(-50%) rotate(45deg);pointer-events:none}';
      document.head.appendChild(style);
    }
    if (!document.getElementById(UI_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = UI_STYLE_ID;
      style.textContent =
        '#' + UI_ROOT_ID + '{position:fixed;inset:0;z-index:2147483647;display:none}' +
        '#' + UI_ROOT_ID + '.sapx-open{display:block}' +
        '#' + UI_ROOT_ID + ' .sapx-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.72)}' +
        '#' + UI_ROOT_ID + ' .sapx-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 24px));background:linear-gradient(180deg,#1b2838 0%,#171a21 100%);border:1px solid rgba(255,255,255,0.08);box-shadow:0 18px 60px rgba(0,0,0,0.65);border-radius:6px;color:#c6d4df;font-family:Arial,Helvetica,sans-serif}' +
        '#' + UI_ROOT_ID + ' .sapx-header{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px 14px;border-bottom:1px solid rgba(255,255,255,0.08)}' +
        '#' + UI_ROOT_ID + ' .sapx-title{font-size:14px;font-weight:700;letter-spacing:0.2px;color:#e5e5e5}' +
        '#' + UI_ROOT_ID + ' .sapx-close{appearance:none;border:0;background:transparent;color:#8f98a0;font-size:18px;line-height:1;cursor:pointer;padding:4px 6px}' +
        '#' + UI_ROOT_ID + ' .sapx-close:hover{color:#c6d4df}' +
        '#' + UI_ROOT_ID + ' .sapx-body{padding:14px;max-height:65vh;overflow-y:auto}' +
        '#' + UI_ROOT_ID + ' .sapx-input{box-sizing:border-box;width:100%;background:#0f141b;border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#c6d4df;padding:8px 10px;font-size:13px}' +
        '#' + UI_ROOT_ID + ' .sapx-details .sapx-field{margin-top:12px}' +
        '#' + UI_ROOT_ID + ' .sapx-error{color:#e46767;margin-top:8px;font-size:12px}' +
        '#' + UI_ROOT_ID + ' .sapx-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}' +
        '#' + UI_ROOT_ID + ' .sapx-label{font-size:12px;color:#acb2b8}' +
        '#' + UI_ROOT_ID + ' select.sapx-select{appearance:none;background:#0f141b;border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#c6d4df;padding:8px 10px;font-size:13px;outline:none}' +
        '#' + UI_ROOT_ID + ' select.sapx-select:focus{border-color:rgba(103,193,245,0.8);box-shadow:0 0 0 2px rgba(103,193,245,0.15)}' +
        '#' + UI_ROOT_ID + ' .sapx-details{border:1px solid rgba(255,255,255,0.08);border-radius:4px;background:rgba(0,0,0,0.15);padding:10px}' +
        '#' + UI_ROOT_ID + ' .sapx-details summary{cursor:pointer;color:#67c1f5;font-size:12px;list-style:none}' +
        '#' + UI_ROOT_ID + ' .sapx-details summary::-webkit-details-marker{display:none}' +
        '#' + UI_ROOT_ID + ' .sapx-row{display:flex;align-items:center;gap:10px;margin-top:10px}' +
        '#' + UI_ROOT_ID + ' .sapx-check{display:flex;align-items:center;gap:8px;font-size:13px;color:#c6d4df}' +
        '#' + UI_ROOT_ID + ' input[type="checkbox"].sapx-checkbox{width:16px;height:16px;accent-color:#67c1f5}' +
        '#' + UI_ROOT_ID + ' .sapx-footer{display:flex;justify-content:flex-end;gap:10px;padding:12px 14px;border-top:1px solid rgba(255,255,255,0.08)}' +
        '#' + UI_ROOT_ID + ' .sapx-btn{appearance:none;border:0;border-radius:2px;padding:8px 12px;font-weight:700;cursor:pointer;font-size:13px}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-primary{background:linear-gradient(180deg,#67c1f5 0%,#4aa3d6 100%);color:#0b1117}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-primary:hover{filter:brightness(1.03)}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-ghost{background:rgba(255,255,255,0.06);color:#c6d4df}' +
        '#' + UI_ROOT_ID + ' .sapx-btn-ghost:hover{background:rgba(255,255,255,0.09)}';
      document.head.appendChild(style);
    }
  }
