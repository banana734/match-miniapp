const familyColumns = [
  { key: 'child_name', label: '孩子姓名', kind: 'text' },
  { key: 'parent_name', label: '家长称呼', kind: 'text' },
  { key: 'phone', label: '手机号', kind: 'text' },
  { key: 'wechat', label: '微信号', kind: 'text' },
  { key: 'area_text', label: '所在区域', kind: 'choice' },
  { key: 'gender', label: '性别', kind: 'choice' },
  { key: 'grade_text', label: '年级', kind: 'choice' },
  { key: 'subjects_json', label: '需要科目', kind: 'multi' },
  { key: 'difficulties_json', label: '学习困难', kind: 'multi' },
  { key: 'teacher_traits_json', label: '老师特质', kind: 'multi' },
  { key: 'teaching_styles_json', label: '教学风格', kind: 'multi' },
  { key: 'main_focus_text', label: '辅导重点', kind: 'choice' },
  { key: 'learning_state', label: '学习状态', kind: 'choice' },
  { key: 'communication_expectation_text', label: '沟通期待', kind: 'choice' },
  { key: 'understanding', label: '项目理解', kind: 'choice' },
  { key: 'feedback_willingness', label: '反馈意愿', kind: 'choice' },
  { key: 'class_modes_json', label: '上课方式', kind: 'multi' },
  { key: 'class_frequency', label: '上课频率', kind: 'text' },
  { key: 'intro', label: '补充介绍', kind: 'text' },
  { key: 'extra_note', label: '额外备注', kind: 'text' },
  { key: 'updated_at', label: '最近更新', kind: 'text' },
  { key: 'openid', label: '微信标识', kind: 'text' }
]

const mentorColumns = [
  { key: 'name', label: '导师姓名', kind: 'text' },
  { key: 'gender', label: '性别', kind: 'choice' },
  { key: 'mentor_project', label: '参加项目', kind: 'choice' },
  { key: 'core_member', label: '骨干成员', kind: 'choice' },
  { key: 'grade_text', label: '年级', kind: 'choice' },
  { key: 'school', label: '学校', kind: 'text' },
  { key: 'major', label: '专业', kind: 'text' },
  { key: 'college', label: '学院', kind: 'text' },
  { key: 'wechat', label: '微信号', kind: 'text' },
  { key: 'mentor_subjects_json', label: '擅长科目', kind: 'multi' },
  { key: 'mentor_teaching_grade_range_json', label: '意向教学年级段', kind: 'multi' },
  { key: 'mentor_style_types_json', label: '风格类型', kind: 'multi' },
  { key: 'mentor_teaching_modes_json', label: '上课方式', kind: 'multi' },
  { key: 'mentor_summer_location', label: '暑假所在地', kind: 'text' },
  { key: 'mentor_school_location', label: '开学后所在地', kind: 'text' },
  { key: 'mentor_class_frequency', label: '上课频率', kind: 'text' },
  { key: 'updated_at', label: '最近更新', kind: 'text' },
  { key: 'openid', label: '微信标识', kind: 'text' }
]

const tabConfigs = {
  family: {
    countId: 'familyCount',
    statusId: 'familyStatus',
    tableWrapId: 'familyTableWrap',
    panelId: 'familyPanel',
    endpoint: '/api/admin/families',
    columns: familyColumns,
    actionRole: 'family'
  },
  mentor: {
    countId: 'mentorCount',
    statusId: 'mentorStatus',
    tableWrapId: 'mentorTableWrap',
    panelId: 'mentorPanel',
    endpoint: '/api/admin/mentors',
    columns: mentorColumns,
    actionRole: 'mentor'
  },
  feedbacks: {
    countId: 'feedbackCount',
    statusId: 'feedbackStatus',
    tableWrapId: 'feedbackTableWrap',
    panelId: 'feedbackPanel',
    endpoint: '/api/admin/feedbacks',
    custom: 'feedbacks'
  },
  pairings: {
    statusId: 'pairingStatus',
    tableWrapId: 'pairingTableWrap',
    panelId: 'pairingPanel',
    endpoint: '/api/admin/pairings',
    custom: 'pairings'
  }
}

const state = {
  family: [],
  mentor: [],
  feedbacks: [],
  pairings: []
}

const refreshButton = document.getElementById('refreshButton')
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'))
const emptyText = '<span class="cell-empty">未填写</span>'

const escapeHtml = (value) => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && item !== '')
  }

  if (value === null || value === undefined || value === '') {
    return []
  }

  return [value]
}

const renderCapsules = (items = []) => {
  if (!items.length) {
    return emptyText
  }

  return `
    <div class="capsule-list">
      ${items.map((item) => `<span class="capsule">${escapeHtml(item)}</span>`).join('')}
    </div>
  `
}

const renderText = (value) => {
  if (value === null || value === undefined || value === '') {
    return emptyText
  }

  if (typeof value === 'object') {
    return `<div class="text-block">${escapeHtml(JSON.stringify(value, null, 2))}</div>`
  }

  return `<div class="text-block">${escapeHtml(value)}</div>`
}

const formatValue = (value, kind = 'text') => {
  if (kind === 'choice' || kind === 'multi') {
    return renderCapsules(toArray(value))
  }

  return renderText(value)
}

// 表格里给一行取个显示名（删除确认弹窗里提示用）
const rowDisplayName = (row, role) => {
  if (role === 'mentor') {
    return row.name || row.openid || '未知'
  }

  return row.child_name || row.parent_name || row.openid || '未知'
}

// 渲染列表表格。传了 actionRole 就在最后多一列「操作」（删除按钮）
const renderTable = (mountNode, columns, rows, actionRole = '') => {
  if (!rows.length) {
    mountNode.innerHTML = '<div class="empty-state">当前还没有数据</div>'
    return
  }

  const headHtml =
    columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('') +
    (actionRole ? '<th class="cell-action">操作</th>' : '')

  const bodyHtml = rows
    .map((row) => {
      const cellHtml = columns
        .map((column) => `<td class="cell-${column.kind}">${formatValue(row[column.key], column.kind)}</td>`)
        .join('')

      const actionHtml = actionRole
        ? `<td class="cell-action">
             <button class="delete-profile-btn" type="button"
               data-openid="${escapeHtml(row.openid || '')}"
               data-role="${escapeHtml(actionRole)}"
               data-name="${escapeHtml(rowDisplayName(row, actionRole))}">删除</button>
           </td>`
        : ''

      return `<tr>${cellHtml}${actionHtml}</tr>`
    })
    .join('')

  mountNode.innerHTML = `
    <table>
      <thead>
        <tr>${headHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `
}

const setTab = (tabName) => {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName)
  })

  Object.entries(tabConfigs).forEach(([key, config]) => {
    const panelNode = document.getElementById(config.panelId)
    panelNode.classList.toggle('active', key === tabName)
  })
}

const fetchJson = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }

  return response.json()
}

const setStatusText = (key, text) => {
  document.getElementById(tabConfigs[key].statusId).textContent = text
}

const setCountText = (key, total) => {
  document.getElementById(tabConfigs[key].countId).textContent = String(total)
}

const renderTabData = (key) => {
  const config = tabConfigs[key]

  if (config.custom === 'feedbacks') {
    renderFeedbacks()
    return
  }

  if (config.custom === 'pairings') {
    renderPairings()
    return
  }

  const tableWrapNode = document.getElementById(config.tableWrapId)
  renderTable(tableWrapNode, config.columns, state[key], config.actionRole)
}

// 渲染「反馈管理」Tab：按提交人（openid）聚合，每人一块，
// 块内分「试课反馈」「日常反馈」两组，每条反馈带删除按钮。
const renderFeedbacks = () => {
  const config = tabConfigs.feedbacks
  const mountNode = document.getElementById(config.tableWrapId)
  const statusNode = document.getElementById(config.statusId)
  const all = Array.isArray(state.feedbacks) ? state.feedbacks : []

  // 名字解析：优先导师名，其次家长的孩子/家长称呼，都没有就用 openid 前几位
  const nameOf = (openid) => {
    const mentorRow = (state.mentor || []).find((row) => stripRolePrefix(row.openid) === openid)
    if (mentorRow && mentorRow.name) return mentorRow.name

    const familyRow = (state.family || []).find((row) => stripRolePrefix(row.openid) === openid)
    if (familyRow) return familyRow.child_name || familyRow.parent_name || `用户 ${openid.slice(0, 6)}`

    return `用户 ${openid.slice(0, 6)}`
  }

  // 按 openid 聚合
  const personMap = new Map()
  all.forEach((fb) => {
    const id = fb.openid
    if (!personMap.has(id)) personMap.set(id, [])
    personMap.get(id).push(fb)
  })

  const persons = Array.from(personMap.entries()).map(([openid, list]) => ({
    openid,
    // 一个 openid 只有一种身份，取任意一条反馈的 role 即可
    role: list.some((fb) => fb.role === 'mentor') ? 'mentor' : 'family',
    name: nameOf(openid),
    list: list.slice().sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
  }))

  // 姓名排序，中文按拼音
  persons.sort((a, b) => a.name.localeCompare(b.name, 'zh'))

  if (!persons.length) {
    mountNode.innerHTML = '<div class="empty-state">当前还没有任何反馈</div>'
    statusNode.textContent = '暂无反馈'
    return
  }

  // 一个人的一块：标题是姓名，块内分「试课反馈 / 日常反馈」两组
  const renderPersonBlock = (person) => {
    const trial = person.list.filter((fb) => fb.kind === 'trial')
    const daily = person.list.filter((fb) => fb.kind === 'daily')

    return `
      <div class="fb-person">
        <h3 class="fb-person-title">
          ${escapeHtml(person.name)}
          <span class="fb-person-meta">${escapeHtml(person.openid.slice(0, 10))} · 共 ${person.list.length} 条</span>
        </h3>
        ${trial.length ? `<div class="fb-group-label">试课反馈（${trial.length}）</div>${trial.map(renderFeedbackItem).join('')}` : ''}
        ${daily.length ? `<div class="fb-group-label">日常反馈（${daily.length}）</div>${daily.map(renderFeedbackItem).join('')}` : ''}
      </div>
    `
  }

  // 身份大组：导师 / 家长。该身份下没人就不渲染这一组
  const renderRoleGroup = (role, title) => {
    const members = persons.filter((person) => person.role === role)
    if (!members.length) return ''

    const feedbackCount = members.reduce((sum, person) => sum + person.list.length, 0)

    return `
      <div class="fb-role-group">
        <h3 class="fb-role-title">${escapeHtml(title)}（${members.length} 人 · ${feedbackCount} 条反馈）</h3>
        ${members.map(renderPersonBlock).join('')}
      </div>
    `
  }

  mountNode.innerHTML = renderRoleGroup('mentor', '导师') + renderRoleGroup('family', '家长')

  statusNode.textContent = `共 ${persons.length} 人 · ${all.length} 条反馈`
}

// 渲染单条反馈卡片：头部带类型徽章 + 删除按钮，主体展示各字段
// （身份不在这里显示，已由外层「导师 / 家长」大组体现）
const renderFeedbackItem = (fb) => {
  const kindBadge = fb.kind === 'daily'
    ? '<span class="badge badge-daily">日常反馈</span>'
    : '<span class="badge badge-trial">试课反馈</span>'

  const row = (label, value, isMulti = false) => {
    if (value === null || value === undefined || value === '') return ''
    const inner = isMulti ? renderCapsules(toArray(value)) : renderText(value)
    return `<div class="fb-row"><div class="fb-key">${escapeHtml(label)}</div><div class="fb-val">${inner}</div></div>`
  }

  const targetText =
    (fb.target_title || '') + (fb.target_subtitle ? `（${fb.target_subtitle}）` : '')

  return `
    <div class="fb-item" data-id="${escapeHtml(fb.id)}" data-role="${escapeHtml(fb.role)}" data-kind="${escapeHtml(fb.kind)}">
      <div class="fb-item-head">
        ${kindBadge}
        <span class="fb-date">${escapeHtml(fb.event_date || '日期未填')}${fb.event_duration ? ' · ' + escapeHtml(fb.event_duration) : ''}</span>
        <button class="delete-feedback-btn" type="button"
          data-id="${escapeHtml(fb.id)}" data-role="${escapeHtml(fb.role)}" data-kind="${escapeHtml(fb.kind)}">删除</button>
      </div>
      <div class="fb-item-body">
        ${row('反馈对象', targetText)}
        ${row('满意点', fb.satisfaction_points_json, true)}
        ${row('满意点补充', fb.satisfaction_point_other)}
        ${row('客观不满意点', fb.objective_unsatisfied_json, true)}
        ${row('客观补充', fb.objective_unsatisfied_other)}
        ${row('主观不满意点', fb.subjective_unsatisfied_json, true)}
        ${row('主观补充', fb.subjective_unsatisfied_other)}
        ${row('是否继续合作', fb.continue_choice)}
        ${row('合作补充', fb.continue_choice_other)}
        ${row('反馈后状态', fb.status_after_feedback)}
        ${row('最近更新', fb.updated_at)}
      </div>
    </div>
  `
}

// 去掉 family-/mentor- 前缀，拿到原始 openid（配对记录里我的 openid 无前缀，对方的 card_id 带前缀）
const stripRolePrefix = (openid = '') => {
  return String(openid).replace(/^(family-|mentor-)/, '')
}

// 渲染「试课 / 配对关系」Tab：以「人」为中心分成导师 / 家长两组，
// 每人一行：正式上课→和谁、待试课→是谁、没有活跃配对→未匹配。
// 一条真实配对在 trial_records 里可能存成两条方向相反的镜像记录，
// 先按「两个 openid 排序拼接」去重合并，再双向挂到两个人头上。
const renderPairings = () => {
  const config = tabConfigs.pairings
  const mountNode = document.getElementById(config.tableWrapId)
  const statusNode = document.getElementById(config.statusId)
  const records = Array.isArray(state.pairings) ? state.pairings : []

  if (!records.length) {
    mountNode.innerHTML = '<div class="empty-state">当前还没有配对记录</div>'
    statusNode.textContent = '暂无配对'
    return
  }

  // 1) 镜像记录去重成「一对」：状态优先保留非 removed 的那条
  const pairMap = new Map()

  records.forEach((item) => {
    const a = stripRolePrefix(item.myOpenid)
    const b = stripRolePrefix(item.counterpartOpenid)
    if (!a || !b) return // 早期脏数据（openid 为空）跳过

    const key = [a, b].sort().join('::')
    const prev = pairMap.get(key)

    if (!prev) {
      pairMap.set(key, {
        a,
        b,
        aRole: item.myRole,
        bRole: item.counterpartRole,
        status: item.status,
        continueChoice: item.continueChoice || ''
      })
    } else if (prev.status === 'removed' && item.status !== 'removed') {
      prev.status = item.status
      prev.continueChoice = item.continueChoice || ''
    }
  })

  // 2) 按人聚合：personMap[openid] = { roles: Set, partners: [{id, status, continueChoice}] }
  const personMap = new Map()

  pairMap.forEach((pair) => {
    ;[
      { self: pair.a, selfRole: pair.aRole, other: pair.b, otherRole: pair.bRole },
      { self: pair.b, selfRole: pair.bRole, other: pair.a, otherRole: pair.aRole }
    ].forEach(({ self, selfRole, other, otherRole }) => {
      if (!personMap.has(self)) {
        personMap.set(self, { roles: new Set(), partners: [] })
      }

      const entry = personMap.get(self)
      entry.roles.add(selfRole)
      entry.partners.push({ id: other, status: pair.status, continueChoice: pair.continueChoice })
    })
  })

  // 3) 每人汇总：把活跃配对按状态拆成「正式上课」和「待试课」两组，
  //    这样两类状态可以同框显示（一个人可能既有正式上课、又有待试课）
  const summarizePerson = (openid) => {
    const entry = personMap.get(openid)

    if (!entry) {
      return { formals: [], pendings: [] }
    }

    return {
      formals: entry.partners.filter((p) => p.status === 'formal'),
      pendings: entry.partners.filter((p) => p.status === 'pending')
    }
  }

  // 把 openid 翻译成姓名（优先导师名，其次家长的孩子/家长称呼）
  const nameOf = (openid) => {
    const mentorRow = (state.mentor || []).find((row) => stripRolePrefix(row.openid) === openid)
    if (mentorRow && mentorRow.name) return mentorRow.name

    const familyRow = (state.family || []).find((row) => stripRolePrefix(row.openid) === openid)
    if (familyRow) return familyRow.child_name || familyRow.parent_name || `用户 ${openid.slice(0, 6)}`

    return `用户 ${openid.slice(0, 6)}`
  }

  // 4) 组装一组成员：先按名单（最全，含没配过对的人），再补配对里出现但不在名单的孤儿数据
  const buildMembers = (listRows, listRole) => {
    const members = []
    const usedIds = new Set()

    ;(listRows || []).forEach((row) => {
      const id = stripRolePrefix(row.openid)
      if (!id || usedIds.has(id)) return
      usedIds.add(id)

      const sum = summarizePerson(id)
      members.push({
        id,
        name: row.child_name || row.parent_name || row.name || `用户 ${id.slice(0, 6)}`,
        formals: sum.formals,
        pendings: sum.pendings
      })
    })

    personMap.forEach((entry, id) => {
      if (usedIds.has(id)) return
      const role = entry.roles.has('mentor') ? 'mentor' : 'family'
      if (role !== listRole) return
      usedIds.add(id)

      const sum = summarizePerson(id)
      members.push({
        id,
        name: `用户 ${id.slice(0, 6)}`,
        formals: sum.formals,
        pendings: sum.pendings
      })
    })

    return members
  }

  const renderGroupTable = (members) => {
    if (!members.length) {
      return '<div class="empty-state">暂无数据</div>'
    }

    const rows = members
      .map((m) => {
        const formalNames = m.formals.map((p) => nameOf(p.id)).join('、')
        const pendingNames = m.pendings.map((p) => nameOf(p.id)).join('、')

        // 有对应配对才显示状态徽章，否则显示「无」
        const formalBadge = m.formals.length
          ? '<span class="badge badge-formal">正式上课</span>'
          : '<span class="cell-empty">无</span>'
        const formalObj = formalNames
          ? `<div class="text-block">${escapeHtml(formalNames)}</div>`
          : '<span class="cell-empty">无</span>'

        const pendingBadge = m.pendings.length
          ? '<span class="badge badge-pending">待试课</span>'
          : '<span class="cell-empty">无</span>'
        const pendingObj = pendingNames
          ? `<div class="text-block">${escapeHtml(pendingNames)}</div>`
          : '<span class="cell-empty">无</span>'

        return `
          <tr>
            <td class="cell-pairing">${escapeHtml(m.name)}</td>
            <td class="cell-status">${formalBadge}</td>
            <td class="cell-text">${formalObj}</td>
            <td class="cell-status">${pendingBadge}</td>
            <td class="cell-text">${pendingObj}</td>
          </tr>
        `
      })
      .join('')

    return `
      <table class="pairing-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>正式上课</th>
            <th>正式上课对象</th>
            <th>待试课</th>
            <th>待试课对象</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `
  }

  const mentorMembers = buildMembers(state.mentor, 'mentor')
  const familyMembers = buildMembers(state.family, 'family')
  const countFormal = (members) => members.filter((m) => m.formals.length).length
  const countPending = (members) => members.filter((m) => m.pendings.length).length

  mountNode.innerHTML = `
    <div class="pair-group">
      <h3 class="pair-group-title">导师（${mentorMembers.length} 人 · 正式上课 ${countFormal(mentorMembers)} · 待试课 ${countPending(mentorMembers)}）</h3>
      ${renderGroupTable(mentorMembers)}
    </div>
    <div class="pair-group">
      <h3 class="pair-group-title">家长（${familyMembers.length} 人 · 正式上课 ${countFormal(familyMembers)} · 待试课 ${countPending(familyMembers)}）</h3>
      ${renderGroupTable(familyMembers)}
    </div>
  `
  statusNode.textContent = `导师 ${mentorMembers.length} 人 · 家长 ${familyMembers.length} 人`
}

const loadData = async () => {
  Object.keys(tabConfigs).forEach((key) => {
    setStatusText(key, '加载中...')
  })

  refreshButton.disabled = true
  refreshButton.textContent = '刷新中...'

  try {
    const keys = Object.keys(tabConfigs)
    const results = await Promise.all(keys.map((key) => fetchJson(tabConfigs[key].endpoint)))

    keys.forEach((key, index) => {
      const result = results[index] || {}
      state[key] = Array.isArray(result.list) ? result.list : []
      if (tabConfigs[key].countId) {
        setCountText(key, result.total || state[key].length)
      }
      setStatusText(key, `共 ${state[key].length} 条`)
      renderTabData(key)
    })
  } catch (error) {
    Object.keys(tabConfigs).forEach((key) => {
      setStatusText(key, '加载失败')
      document.getElementById(tabConfigs[key].tableWrapId).innerHTML = `
        <div class="empty-state">${escapeHtml(error.message)}</div>
      `
    })
  } finally {
    refreshButton.disabled = false
    refreshButton.textContent = '刷新数据'
  }
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setTab(button.dataset.tab)
  })
})

refreshButton.addEventListener('click', () => {
  loadData()
})

// 反馈管理页签：删除按钮（事件委托，挂在外层容器上）
const feedbackTableWrap = document.getElementById('feedbackTableWrap')
feedbackTableWrap.addEventListener('click', async (event) => {
  const button = event.target.closest('.delete-feedback-btn')
  if (!button) return

  const id = button.dataset.id
  const role = button.dataset.role
  const kind = button.dataset.kind

  if (!window.confirm('确定删除这条反馈吗？删除后无法恢复。')) {
    return
  }

  button.disabled = true
  button.textContent = '删除中...'

  try {
    const response = await fetch('/api/admin/delete-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role, kind })
    })
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || `请求失败：${response.status}`)
    }

    // 从内存里移除这条反馈，重新渲染（连同计数卡一起更新）
    state.feedbacks = state.feedbacks.filter((fb) => fb.id !== id)
    document.getElementById('feedbackCount').textContent = String(state.feedbacks.length)
    renderFeedbacks()
  } catch (error) {
    window.alert(`删除失败：${error.message}`)
    button.disabled = false
    button.textContent = '删除'
  }
})

// 资料页签：删除按钮（事件委托，挂在两个表格容器上）。
// 彻底删除：资料 + 身份绑定 + 相关试课记录 + 他提交的反馈，不可恢复，所以弹窗把后果列清楚。
const handleDeleteProfile = async (button) => {
  const openid = button.dataset.openid
  const role = button.dataset.role
  const name = button.dataset.name || openid
  const roleText = role === 'mentor' ? '导师' : '家长'

  const confirmed = window.confirm(
    `确定彻底删除${roleText}「${name}」吗？\n\n` +
      `将同时删除：\n` +
      `· 他的资料\n` +
      `· 他的身份绑定\n` +
      `· 和他相关的试课记录（对方那边的卡片也会一起消失）\n` +
      `· 他提交的所有反馈\n\n` +
      `删除后无法恢复。`
  )

  if (!confirmed) return

  button.disabled = true
  button.textContent = '删除中...'

  try {
    const response = await fetch('/api/admin/delete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openid, role })
    })
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || `请求失败：${response.status}`)
    }

    const count = result.deleted || {}
    window.alert(
      `已彻底删除「${name}」\n\n` +
        `资料 ${count.users || 0} 条 · 身份绑定 ${count.roleBindings || 0} 条\n` +
        `试课记录 ${count.trialRecords || 0} 条 · 反馈 ${count.feedbacks || 0} 条`
    )

    // 删的是底层数据，资料 / 反馈 / 配对三个页签都会受影响，整份重新拉
    loadData()
  } catch (error) {
    window.alert(`删除失败：${error.message}`)
    button.disabled = false
    button.textContent = '删除'
  }
}

const bindProfileDelete = (wrapId) => {
  document.getElementById(wrapId).addEventListener('click', (event) => {
    const button = event.target.closest('.delete-profile-btn')
    if (button) {
      handleDeleteProfile(button)
    }
  })
}

bindProfileDelete('familyTableWrap')
bindProfileDelete('mentorTableWrap')

setTab('family')
loadData()
