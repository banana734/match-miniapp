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
  { key: 'mentor_project', label: '是否参加友导师项目', kind: 'choice' },
  { key: 'core_member', label: '是否骨干成员', kind: 'choice' },
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

const state = {
  families: [],
  mentors: []
}

const familyCount = document.getElementById('familyCount')
const mentorCount = document.getElementById('mentorCount')
const familyStatus = document.getElementById('familyStatus')
const mentorStatus = document.getElementById('mentorStatus')
const familyTableWrap = document.getElementById('familyTableWrap')
const mentorTableWrap = document.getElementById('mentorTableWrap')
const refreshButton = document.getElementById('refreshButton')
const tabButtons = Array.from(document.querySelectorAll('.tab-btn'))
const panels = {
  family: document.getElementById('familyPanel'),
  mentor: document.getElementById('mentorPanel')
}

const emptyText = '<span class="cell-empty">未填写</span>'

const escapeHtml = (value) => {
  return value
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
      ${items
        .map((item) => `<span class="capsule">${escapeHtml(String(item))}</span>`)
        .join('')}
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

  return `<div class="text-block">${escapeHtml(String(value))}</div>`
}

const formatValue = (value, kind = 'text') => {
  if (kind === 'choice' || kind === 'multi') {
    return renderCapsules(toArray(value))
  }

  return renderText(value)
}

const renderTable = (mountNode, columns, rows) => {
  if (!rows.length) {
    mountNode.innerHTML = '<div class="empty-state">当前还没有资料数据</div>'
    return
  }

  const headHtml = columns
    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
    .join('')

  const bodyHtml = rows
    .map((row) => {
      const cellHtml = columns
        .map((column) => {
          return `<td class="cell-${column.kind}">${formatValue(row[column.key], column.kind)}</td>`
        })
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
    const isActive = button.dataset.tab === tabName
    button.classList.toggle('active', isActive)
  })

  Object.entries(panels).forEach(([key, node]) => {
    node.classList.toggle('active', key === tabName)
  })
}

const fetchJson = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }

  return response.json()
}

const loadData = async () => {
  familyStatus.textContent = '加载中...'
  mentorStatus.textContent = '加载中...'
  refreshButton.disabled = true
  refreshButton.textContent = '刷新中...'

  try {
    const [familyData, mentorData] = await Promise.all([
      fetchJson('/api/admin/families'),
      fetchJson('/api/admin/mentors')
    ])

    state.families = Array.isArray(familyData.list) ? familyData.list : []
    state.mentors = Array.isArray(mentorData.list) ? mentorData.list : []

    familyCount.textContent = String(familyData.total || state.families.length)
    mentorCount.textContent = String(mentorData.total || state.mentors.length)
    familyStatus.textContent = `共 ${state.families.length} 条`
    mentorStatus.textContent = `共 ${state.mentors.length} 条`

    renderTable(familyTableWrap, familyColumns, state.families)
    renderTable(mentorTableWrap, mentorColumns, state.mentors)
  } catch (error) {
    familyStatus.textContent = '加载失败'
    mentorStatus.textContent = '加载失败'
    familyTableWrap.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`
    mentorTableWrap.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`
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
