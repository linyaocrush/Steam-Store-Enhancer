  const CART_ITEM_ROW = '.bKkQiLkI-vk-';
  const CART_ITEM_WRAPPER = '.i-xXuvHLioU-[role="button"]';
  const CART_ITEM_CAPSULE = 'a.wuZBJ1ixmBQ-[href], ._7RJqaqzA6VI- a[href]';
  const CART_ITEM_PRICES = '.StoreOriginalPrice, .j3jr1YqpBGk- > .-nS4ZC0Bruo-';
  const PAGE_ADAPTERS = Object.freeze({
    wishlist: { rows: '.wishlist_row, .wishlistRowItem, [data-rfd-draggable-id^="WishlistItem-"], .Panel div[data-index]' },
    storeSale: { rows: 'a.search_result_row, a.tab_item, a.tab_row_item, a.recommendation_link, .store_main_capsule, .store_capsule, .small_cap, .large_cap, [data-ds-appid], [data-app-id]' },
    cart: { rows: CART_ITEM_ROW + ', ' + CART_ITEM_WRAPPER, total: '.i1XZFikuzME- .n9HLAjXXhvI-', anchors: '.i1XZFikuzME-, a[href*="checkout.steampowered.com/checkout"]' },
    quick: { rows: 'a.search_result_row, a.tab_item, a.recommendation_link, .wishlist_row, [data-rfd-draggable-id^="WishlistItem-"], .game_purchase_action' },
    family: { rows: 'a[href*="/app/"], [data-ds-appid], [data-app-id], [data-rfd-draggable-id^="WishlistItem-"]',
      anchors: '#wishlist_link, #store_nav_wishlist_link, a[href*="/wishlist"], .queue_and_playtime, #game_area_purchase, .game_area_purchase, #game_score' },
    restrictions: { titles: '#appHubAppName, .search_result_row .title, .tab_item_name, .wishlist_row .title, ' +
      '[data-rfd-draggable-id^="WishlistItem-"] a[href*="/app/"], .gameListRow .gameListRowItemName, ' +
      '.recommendation_link .game_name, .capsule .title, .store_capsule .title, .tab_item_title, ' +
      '.store_main_capsule .app_name, .store_main_capsule .app_name > div, .dailydeal_desc .game_name, ' +
      '.home_content .game_name, .community_recommendation_app .app_name, .home_content.single .single_title, ' +
      '[data-ds-appid] [class*="StoreSaleWidgetTitle"], [data-ds-appid] [class*="GameName"]' }
  });
  const ITEM_ATTRIBUTES = ['href', 'data-ds-appid', 'data-ds-packageid', 'data-ds-bundleid', 'data-app-id', 'data-rfd-draggable-id'];
  const PRICE_SELECTORS = [
    '.discount_final_price', '.discount_original_price', '.game_purchase_price',
    '.game_area_dlc_price', '.col.search_price.responsive_secondrow strike',
    '.col.search_price.responsive_secondrow .discount_final_price',
    '.Panel.Focusable .StoreOriginalPrice', '.Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8',
    '._2WLaY5TxjBGVyuWe_6KS3N', '.game_area_purchase_game_dropdown_selection > span',
    '.game_area_purchase_game_dropdown_menu_item_text',
    '.StoreOriginalPrice', '.j3jr1YqpBGk- > .-nS4ZC0Bruo-'
  ].join(',');
  const CONVERSION_SELECTORS = [
    '.discount_prices > .discount_final_price',
    '.Hxi-pnf9Xlw- span.HOrB6lehQpg-', '.btnv6_white_transparent > span',
    '.Wh0L8EnwsPV_8VAu8TOYr', '._3j4dI1yA7cRfCvK8h406OB', '._1EKGZBnKFWOr3RqVdnLMRN', '._3fFFsvII7Y2KXNLDk_krOW',
    'div.accountData.price', '.addfunds_area_purchase_game.game_area_purchase_game > h1',
    '.addfunds_area_purchase_game.game_area_purchase_game.es_custom_money > p',
    'div.vTro5UlZ-gU- > div.QO6CjVPSFuI-', 'a.En-WtuWIGUc- > span.nikULGV-7Q0-',
    'div.-OkCLv-56oQ- > div._9Rf9BwU0xAQ-', 'div.-OkCLv-56oQ- > div.-HQzBzl6lqI-',
    'label.qhUI2RnjHYw-', 'button.cDJOlrqyRq8-.n5jTCXrzS8A-.Focusable', 'div.f6hU22EA7Z8peFWZVBJU',
    '.Panel.Focusable ._3-o3G9jt3lqcvbRXt8epsn.StoreOriginalPrice', '.Panel.Focusable .pk-LoKoNmmPK4GBiC9DR8',
    '._2WLaY5TxjBGVyuWe_6KS3N', '#checkout_review_cart_area .checkout_review_item_price > .price',
    '#review_subtotal_value.price', '#review_total_value.price', '#account_dropdown .account_name',
    '#es_summary .es_market_summary_item', '#marketWalletBalanceAmount', 'span.normal_price[data-price]',
    'button.inqz7Zdx9Xg-.ob-nIzzquk8-.fkz-MePtKwI-.D8IENuW8Q7w-', 'span.IokSIloSPlA-',
    'text.recharts-text.recharts-cartesian-axis-tick-value > tspan',
    '.QFW0BtI4l77AFmv1xLAkx._1B1XTNsfuwOaDPAkkr8M42 ._3hEeummFKRey8l5VXxZwxz > span',
    '.game_area_purchase_game_dropdown_selection > span',
    '.game_area_purchase_game_dropdown_menu_items_container_background.game_area_purchase_game_dropdown_menu_items_container td.game_area_purchase_game_dropdown_menu_item_text',
    '.discount_original_price', '.discount_final_price', '.col.search_price.responsive_secondrow strike',
    '#header_wallet_balance > span.tooltip', '.esi-wishlist-stat > .num',
    '.salepreviewwidgets_StoreOriginalPrice_1EKGZ', '.salepreviewwidgets_StoreSalePriceBox_Wh0L8',
    '.contenthubshared_OriginalPrice_3hBh3', '.contenthubshared_FinalPrice_F_tGv',
    '.salepreviewwidgets_StoreSalePriceBox_Wh0L8:not(.salepreviewwidgets_StoreSalePrepurchaseLabel_Wxeyn)',
    'tr.wallet_table_row > td.wht_total', 'tr.wallet_table_row > td.wht_wallet_change.wallet_column',
    'tr.wallet_table_row > td.wht_wallet_balance.wallet_column', '.package_totals_row > .price:not(.bundle_discount)',
    '#package_savings_bar > .savings.bundle_savings', '.home_page_content_title a.btn_small_tall > span'
  ];
  function getConversionSelectors() {
    return isCartPage() ? CONVERSION_SELECTORS.concat([
      '.StoreOriginalPrice', '.j3jr1YqpBGk- > .-nS4ZC0Bruo-', '.i1XZFikuzME- .n9HLAjXXhvI-',
      'main [class*="price" i]', 'main [class*="Price"]', '[role="main"] [class*="price" i]',
      '[class*="cart" i] [class*="price" i]', '[data-testid*="price" i]'
    ]) : CONVERSION_SELECTORS;
  }
