import { reactive } from 'vue'

const isArrayKey = (arrayKeys, key) => arrayKeys.includes(key)

const cloneValue = (value, defaultValue, asArray) => {
  if (asArray) {
    return Array.isArray(value) ? [...value] : [...defaultValue]
  }

  return value ?? defaultValue
}

export const useProfileForm = (defaults, arrayKeys = []) => {
  const createSnapshot = (profile = {}) => {
    const snapshot = {}

    for (const key of Object.keys(defaults)) {
      snapshot[key] = cloneValue(profile[key], defaults[key], isArrayKey(arrayKeys, key))
    }

    return snapshot
  }

  const form = reactive(createSnapshot())

  const syncFormFromProfile = (profile = {}) => {
    Object.assign(form, createSnapshot(profile))
  }

  const createPayload = () => {
    const payload = { ...form }

    for (const key of arrayKeys) {
      payload[key] = Array.isArray(form[key]) ? [...form[key]] : []
    }

    return payload
  }

  return {
    form,
    syncFormFromProfile,
    createPayload
  }
}
