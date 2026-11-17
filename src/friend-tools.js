  function initializeFriendTools() {
    if (location.hostname !== 'steamcommunity.com' || !/\/friends\/?$/i.test(location.pathname)) return;
    const log = createLogger('好友工具');
    log.info('留言、分组与统计已启用');

    const ROOT_ID = 'sse-friend-tools';
    const style = document.createElement('style');
    style.textContent = `
      #${ROOT_ID}{box-sizing:border-box;clear:both;width:100%;margin:12px 0;padding:16px;background:#171a21;border:1px solid #456078;border-radius:6px;color:#c6d4df;font:13px/1.5 Arial,sans-serif}
      #${ROOT_ID} .sse-friend-tabs{display:flex;gap:8px;border-bottom:1px solid #34465a;margin-bottom:14px;padding-bottom:8px}#${ROOT_ID} [role=tab][aria-selected=true]{color:#fff;background:#356583}#${ROOT_ID} [hidden]{display:none!important}
      #search_results .sse-friend-select{position:absolute;right:8px;top:8px;z-index:5;width:18px;height:18px;accent-color:#67c1f5;cursor:pointer}
      #${ROOT_ID} h2{flex:none;font-size:15px;margin:0 0 6px;color:#fff}#${ROOT_ID} .sse-friend-description{flex:none;margin-bottom:8px;color:#acb2b8}#${ROOT_ID} textarea{box-sizing:border-box;width:100%;min-height:72px;resize:vertical;padding:8px;background:#0f141b;border:1px solid #34465a;border-radius:3px;color:#fff;font:inherit}
      #${ROOT_ID} .sse-friend-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}#${ROOT_ID} button{border:0;border-radius:3px;padding:7px 10px;background:#27465c;color:#d8efff;cursor:pointer}#${ROOT_ID} button:disabled{opacity:.5;cursor:default}
      #${ROOT_ID} .sse-friend-groups{flex:none;padding:8px;border-top:1px solid #34465a;border-bottom:1px solid #34465a}#${ROOT_ID} .sse-friend-groups strong{display:block;margin-bottom:4px;color:#fff}#${ROOT_ID} .sse-friend-groups input,#${ROOT_ID} .sse-friend-groups select{box-sizing:border-box;max-width:100%;min-width:0;padding:6px;background:#0f141b;border:1px solid #34465a;color:#d7e8f2}#${ROOT_ID} .sse-friend-groups [role=status]{margin-top:4px}
      #${ROOT_ID} .sse-friend-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0;padding:8px 0;border-block:1px solid #34465a}#${ROOT_ID} .sse-friend-stat{min-width:0;color:#acb2b8;font-size:11px}#${ROOT_ID} .sse-friend-stat strong{display:block;color:#d7e8f2;font-size:16px}
      #${ROOT_ID} [role=status]{flex:none;display:block;min-height:24px;max-height:120px;overflow:auto;margin-top:8px;padding:7px;background:#0f141b;border-left:3px solid #67c1f5;white-space:pre-wrap;color:#d7e8f2;font-size:12px}
      #manage_friends.manage_friends_panel{box-sizing:border-box;width:100%;margin:12px 0;padding:16px;background:#171a21;border:1px solid #456078;border-radius:6px;color:#c6d4df;font:13px/1.5 Arial,sans-serif}
      #manage_friends.manage_friends_panel>.row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:0;padding:6px 0}#manage_friends.manage_friends_panel .row>.row{display:inline-flex;align-items:center;flex-wrap:wrap;gap:8px}
      #manage_friends .dimmed{color:#acb2b8}#manage_friends .selection_type{display:inline-block;margin:0;padding:4px 9px;background:#27465c;border-radius:3px;color:#d8efff;cursor:pointer}#manage_friends .selection_type a{color:inherit;text-decoration:none}#manage_friends .selection_type:hover{background:#356583;color:#fff}
      #manage_friends .manage_friend_actions_ctn{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0}#manage_friends .manage_action.btnv6_lightblue_blue{box-sizing:border-box;display:inline-flex;align-items:center;margin:0;padding:7px 10px;border:0;border-radius:3px;background:#27465c;color:#d8efff!important;font:13px/1.5 Arial,sans-serif;text-transform:none;box-shadow:none;cursor:pointer}#manage_friends .manage_action.btnv6_lightblue_blue>span{padding:0;background:none;color:inherit;font:inherit}#manage_friends .manage_action.btnv6_lightblue_blue:hover{background:#356583;color:#fff!important}#manage_friends .manage_action .ttip{color:#9ed8f5}
      #manage_friends .selected_msg{margin:0;padding:5px 8px;border-radius:3px;background:#0f141b;color:#d7e8f2}#manage_friends .selected_msg.error{color:#f29b9b}#manage_friends #selected_count{font-weight:bold;color:#67c1f5}#manage_friends .hidden{display:none!important}
    `;
    document.head.appendChild(style);

    const root = createElement('section');
    root.id = ROOT_ID;
    root.setAttribute('aria-label', '好友批量留言');
    const title = createElement('h2', '好友批量留言');
    const description = createElement('div', '勾选下方已加载的好友，向其个人主页发送评论。', 'sse-friend-description');
    const stats = createElement('div', undefined, 'sse-friend-stats');
    const statItems = ['已加载好友', '在线好友', '自定义分组'];
    const statValues = statItems.map(label => {
      const item = createElement('div', undefined, 'sse-friend-stat');
      item.append(createElement('span', label), createElement('strong', '0'));
      stats.appendChild(item);
      return item.lastElementChild;
    });
    const groupSection = createElement('div', undefined, 'sse-friend-groups');
    const groupHeading = createElement('strong', '自定义好友分组');
    const groupControls = createElement('div', undefined, 'sse-friend-actions');
    const groupName = createElement('input');
    groupName.type = 'text';
    groupName.maxLength = 40;
    groupName.placeholder = '新分组名称';
    groupName.setAttribute('aria-label', '新分组名称');
    const createGroup = createElement('button', '创建分组');
    createGroup.type = 'button';
    const groupSelect = createElement('select');
    groupSelect.setAttribute('aria-label', '选择分组');
    const addToGroup = createElement('button', '将已选好友加入分组');
    addToGroup.type = 'button';
    const removeFromGroup = createElement('button', '从分组移除已选好友');
    removeFromGroup.type = 'button';
    const deleteGroup = createElement('button', '删除分组');
    deleteGroup.type = 'button';
    groupControls.append(groupName, createGroup, groupSelect, addToGroup, removeFromGroup, deleteGroup);
    const groupList = createElement('div', undefined, 'sse-friend-actions');
    const groupStatus = createElement('div');
    groupStatus.setAttribute('role', 'status');
    groupSection.append(groupHeading, groupControls, groupList, groupStatus);
    const message = createElement('textarea');
    message.placeholder = '输入要发送的评论';
    message.setAttribute('aria-label', '评论内容');
    const selectionCount = createElement('span', '已选 0 位');
    const actions = createElement('div', undefined, 'sse-friend-actions');
    const send = createElement('button', '发送给已选好友');
    send.type = 'button';
    const status = createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = '就绪。勾选好友并填写评论后发送。';
    actions.append(send);
    const tabs = createElement('div', undefined, 'sse-friend-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', '好友工具');
    const commentPanel = createElement('div');
    commentPanel.append(message, actions, status);
    const statsPanel = createElement('div');
    statsPanel.append(createElement('div', '仅统计当前页面已加载的好友。'), stats);
    const panels = [commentPanel, groupSection, statsPanel];
    const labels = ['留言', '留言设置', '数据分析'];
    for (let index = 0; index < panels.length; index++) {
      const panel = panels[index];
      const tab = createElement('button', labels[index]);
      tab.type = 'button';
      tab.id = `${ROOT_ID}-tab-${index}`;
      panel.id = `${ROOT_ID}-panel-${index}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      tab.setAttribute('aria-selected', String(index === 0));
      panel.hidden = index !== 0;
      tab.addEventListener('click', () => {
        panels.forEach((item, position) => {
          item.hidden = position !== index;
          tabs.children[position].setAttribute('aria-selected', String(position === index));
        });
      });
      tabs.appendChild(tab);
    }
    root.append(title, description, selectionCount, tabs, ...panels);
    const managePanel = document.querySelector('#manage_friends');
    const nativeList = document.querySelector('#search_results');
    if (managePanel) managePanel.after(root);
    else if (nativeList) nativeList.before(root);
    else return;

    const getFriendRows = () => [...document.querySelectorAll('#search_results .selectable[data-steamid]')]
      .filter(row => /^\d{17}$/.test(row.dataset.steamid || ''));
    const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
    // The original assistant opens Steam's native management mode to show card checkboxes.
    if (managePanel && window.getComputedStyle(managePanel).display === 'none' && typeof page.ToggleManageFriends === 'function') {
      page.ToggleManageFriends();
    }
    const accountId = String(page.g_steamID || page.UserConfig?.steamid || 'anonymous');
    const GROUP_STORAGE_KEY = `sse_friend_groups_v1_${accountId}`;
    let groups = GM_getValue(GROUP_STORAGE_KEY, {});
    if (!groups || typeof groups !== 'object' || Array.isArray(groups)) groups = {};

    function saveGroups() { GM_setValue(GROUP_STORAGE_KEY, groups); log.info('本地分组已保存', { count: Object.keys(groups).length }); }
    function renderGroups() {
      const selectedGroup = groupSelect.value;
      groupSelect.replaceChildren(createElement('option', '选择分组'));
      for (const name of Object.keys(groups)) {
        const option = createElement('option', name);
        option.value = name;
        groupSelect.appendChild(option);
      }
      if (groups[selectedGroup]) groupSelect.value = selectedGroup;
      groupList.replaceChildren();
      for (const [name, members] of Object.entries(groups)) {
        const item = createElement('div', `${name} (${members.length})`);
        item.title = members.join(', ');
        groupList.appendChild(item);
      }
    }
    function renderFriends() {
      const friends = getFriendRows();
      for (const friend of friends) {
        const steamId = friend.dataset.steamid;
        const name = friend.querySelector('.friend_block_content')?.textContent.trim().split('\n')[0] || steamId;
        let checkbox = friend.querySelector('.select_friend_checkbox, .sse-friend-select');
        if (!checkbox) {
          checkbox = createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'sse-friend-select';
          friend.style.position = 'relative';
          checkbox.addEventListener('click', event => event.stopPropagation());
          friend.appendChild(checkbox);
        }
        checkbox.setAttribute('aria-label', `选择 ${name}`);
      }
      description.textContent = '勾选要发送评论的好友。';
      updateSelectionCount();
      updateFriendStats();
    }
    function updateFriendStats() {
      const friends = getFriendRows();
      const online = friends.filter(friend => /online|state_online/i.test(`${friend.className} ${friend.querySelector('.friend_block_status')?.className || ''}`)).length;
      statValues[0].textContent = String(friends.length);
      statValues[1].textContent = String(online);
      statValues[2].textContent = String(Object.keys(groups).length);
    }
    function updateSelectionCount() {
      selectionCount.textContent = `已选 ${getSelectedFriends().length} 位`;
    }
    const getSelectedFriends = () => {
      return getFriendRows().filter(row => row.querySelector('.select_friend_checkbox, .sse-friend-select')?.checked);
    };
    const getSessionId = () => {
      const page = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
      return page.g_sessionID || document.querySelector('input[name="sessionid"]')?.value || '';
    };

    renderFriends();
    renderGroups();
    const friendList = document.querySelector('#search_results');
    if (friendList) {
      friendList.addEventListener('change', updateSelectionCount);
      let refreshTimer = null;
      new MutationObserver(() => {
        if (refreshTimer) return;
        refreshTimer = setTimeout(() => {
          refreshTimer = null;
          renderFriends();
        }, 250);
      }).observe(friendList, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-steamid'] });
    }
    createGroup.addEventListener('click', () => {
      const name = groupName.value.trim();
      if (!name) { groupStatus.textContent = '请输入分组名称。'; groupName.focus(); return; }
      if (groups[name]) { groupStatus.textContent = '该分组已存在。'; return; }
      groups[name] = [];
      groupName.value = '';
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupSelect.value = name;
      groupStatus.textContent = `已创建分组“${name}”。`;
    });
    addToGroup.addEventListener('click', () => {
      const name = groupSelect.value;
      const friends = getSelectedFriends();
      if (!groups[name]) { groupStatus.textContent = '请先选择一个分组。'; return; }
      if (!friends.length) { groupStatus.textContent = '请先勾选要加入分组的好友。'; return; }
      const members = new Set(groups[name]);
      for (const friend of friends) members.add(friend.dataset.steamid);
      groups[name] = [...members];
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupSelect.value = name;
      groupStatus.textContent = `已将 ${friends.length} 位好友加入“${name}”。`;
    });
    removeFromGroup.addEventListener('click', () => {
      const name = groupSelect.value;
      const friends = getSelectedFriends();
      if (!groups[name]) { groupStatus.textContent = '请先选择一个分组。'; return; }
      if (!friends.length) { groupStatus.textContent = '请先勾选要移出分组的好友。'; return; }
      const selectedIds = new Set(friends.map(friend => friend.dataset.steamid));
      const before = groups[name].length;
      groups[name] = groups[name].filter(id => !selectedIds.has(id));
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupSelect.value = name;
      groupStatus.textContent = `已从“${name}”移除 ${before - groups[name].length} 位好友。`;
    });
    deleteGroup.addEventListener('click', () => {
      const name = groupSelect.value;
      if (!groups[name]) { groupStatus.textContent = '请先选择一个分组。'; return; }
      if (!window.confirm(`确定删除好友分组“${name}”？`)) return;
      delete groups[name];
      saveGroups();
      renderGroups();
      updateFriendStats();
      groupStatus.textContent = `已删除分组“${name}”。`;
    });

    send.addEventListener('click', async () => {
      const friends = getSelectedFriends();
      const comment = message.value.trim();
      const sessionId = getSessionId();
      if (!friends.length) { status.textContent = '请先在 Steam 好友列表中选择至少一位好友。'; return; }
      if (!comment) { status.textContent = '请输入评论内容。'; message.focus(); return; }
      if (new TextEncoder().encode(comment).length > 1000) { status.textContent = '评论超过 Steam 的 1000 字节限制。'; return; }
      if (!sessionId) { status.textContent = '未能读取 Steam 会话，请刷新好友页面后重试。'; return; }
      if (!window.confirm(`将向 ${friends.length} 位已选好友的个人主页发送相同评论。此操作无法撤回，继续吗？`)) return;

      send.disabled = true;
      log.info('开始批量留言', { count: friends.length });
      status.textContent = `已确认，准备向 ${friends.length} 位好友发送……`;
      const results = [];
      try {
        for (let index = 0; index < friends.length; index++) {
          const friend = friends[index];
          const steamId = friend.dataset.steamid;
          const name = friend.querySelector('.friend_block_content')?.textContent.trim().split('\n')[0] || steamId;
          status.textContent = `正在处理 ${index + 1}/${friends.length}：${name}`;
          try {
          const body = new URLSearchParams({ comment, count: '6', sessionid: sessionId });
          const response = await fetch(`/comment/Profile/post/${steamId}/-1/`, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body
          });
          const result = await response.json();
          if (!response.ok || result.success === false) throw new Error(result.error || `HTTP ${response.status}`);
          results.push(`已发送 ${name}`);
          log.debug('留言发送成功', { index: index + 1, total: friends.length });
          } catch (error) {
            log.warn('留言发送失败', { index: index + 1, message: error.message });
            results.push(`发送失败 ${name}：${error.message || '请求失败'}`);
          }
          status.textContent = `${index + 1}/${friends.length}\n${results.slice(-5).join('\n')}`;
          if (index + 1 < friends.length) await new Promise(resolve => setTimeout(resolve, 4000));
        }
        status.textContent = `处理完成：${results.filter(result => result.startsWith('已发送')).length} 成功，${results.filter(result => result.startsWith('发送失败')).length} 失败。\n${results.join('\n')}`;
        log.info('批量留言完成', { success: results.filter(result => result.startsWith('已发送')).length, failed: results.filter(result => result.startsWith('发送失败')).length });
      } catch (error) {
        log.error('批量留言中断', error.message);
        status.textContent = `批量发送中断：${error.message || String(error)}`;
      } finally {
        send.disabled = false;
      }
    });
  }
