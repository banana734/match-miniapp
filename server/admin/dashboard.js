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
  { key: 'mentor_teaching_grade_range', label: '意向教学年级', kind: 'text' },
  { key: 'mentor_style_types_json', label: '风格类型', kind: 'multi' },
  { key: 'mentor_teaching_modes_json', label: '上课方式', kind: 'multi' },
  { key: 'mentor_summer_location', label: '暑假所在地', kind: 'text' },
  { key: 'mentor_school_location', label: '开学后所在地', kind: 'text' },
  { key: 'mentor_class_frequency', label: '上课频率', kind: 'text' },
  { key: 'updated_at', label: '最近更新', kind: 'text' },
  { key: 'openid', label: '微信标识', kind: 'text' }
]

const feedbackColumns = [
  { key: 'target_title', label: '反馈对象', kind: 'text' },
  { key: 'target_subtitle', label: '对象补充', kind: 'text' },
  { key: 'trial_date', label: '试课日期', kind: 'text' },
  { key: 'trial_duration', label: '试课时长', kind: 'text' },
  { key: 'satisfaction_points_json', label: '满意点', kind: 'multi' },
  { key: 'satisfaction_point_other', label: '满意点补充', kind: 'text' },
  { key: 'objective_unsatisfied_json', label: '客观不满意点', kind: 'multi' },
  { key: 'objective_unsatisfied_other', label: '客观补充', kind: 'text' },
  { key: 'subjective_unsatisfied_json', label: '主观不满意点', kind: 'multi' },
  { key: 'subjective_unsatisfied_other', label: '主观补充', kind: 'text' },
  { key: 'continue_choice', label: '是否继续合作', kind: 'choice' },
  { key: 'continue_choice_other', label: '合作补充', kind: 'text' },
  { key: 'status_after_feedback', label: '反馈后状态', kind: 'choice' },
  { key: 'updated_at', label: '最近更新', kind: 'text' },
  { key: 'openid', label: '提交人微信标识', kind: 'text' }
]

const tabConfigs = {
  family: {
    countId: 'familyCount',
    statusId: 'familyStatus',
    tableWrapId: 'familyTableWrap',
    panelId: 'familyPanel',
    endpoint: '/api/admin/families',
    columns: familyColumns
  },
  mentor: {
    countId: 'mentorCount',
    statusId: 'mentorStatus',
    tableWrapId: 'mentorTableWrap',
    panelId: 'mentorPanel',
    endpoint: '/api/admin/mentors',
    columns: mentorColumns
  },
  familyFeedback: {
    countId: 'familyFeedbackCount',
    statusId: 'familyFeedbackStatus',
    tableWrapId: 'familyFeedbackTableWrap',
    panelId: 'familyFeedbackPanel',
    endpoint: '/api/admin/family-feedbacks',
    columns: feedbackColumns
  },
  mentorFeedback: {
    countId: 'mentorFeedbackCount',
    statusId: 'mentorFeedbackStatus',
    tableWrapId: 'mentorFeedbackTableWrap',
    panelId: 'mentorFeedbackPanel',
    endpoint: '/api/admin/mentor-feedbacks',
    columns: feedbackColumns
  }
}

const state = {
  family: [],
  mentor: [],
  familyFeedback: [],
  mentorFeedback: []
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

const renderTable = (mountNode, columns, rows) => {
  if (!rows.length) {
    mountNode.innerHTML = '<div class="empty-state">当前还没有数据</div>'
    return
  }

  const headHtml = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const bodyHtml = rows
    .map((row) => {
      const cellHtml = columns
        .map((column) => `<td class="cell-${column.kind}">${formatValue(row[column.key], column.kind)}</td>`)
        .join('')

      return `<tr>${cellHtml}</tr>`
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
  const tableWrapNode = document.getElementById(config.tableWrapId)
  renderTable(tableWrapNode, config.columns, state[key])
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
      setCountText(key, result.total || state[key].length)
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

setTab('family')
loadData()
