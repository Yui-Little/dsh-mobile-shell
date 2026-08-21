import { useEffect, useRef } from 'react'

/**
 * Settings → GitHub Token. Stores a classic/fine-grained PAT locally via
 * the plugin host (`~/.dsh/.credentials.yaml`, key `GITHUB_TOKEN`). The
 * value never leaves this device and is never echoed back by GET.
 */

const STATUS_URL = '/api/mobile-nav/github-token'
const SAVE_URL = '/api/mobile-nav/github-token'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (cls !== undefined && cls !== '') node.className = cls
  if (text !== undefined) node.textContent = text
  return node
}

async function readJson<T>(res: Response): Promise<T | null> {
  const text = await res.text()
  if (text === '' || text.startsWith('<')) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function GithubKeyView() {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = hostRef.current
    if (host === null) return
    const zh = (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('zh')

    const page = el('div', 'ghk-page')
    const card = el('div', 'ghk-card')
    const title = el('div', 'ghk-title', zh ? 'GitHub Token' : 'GitHub Token')
    const desc = el(
      'p',
      'ghk-desc',
      zh
        ? '保存在本机 ~/.dsh/.credentials.yaml，用于 git push 和 GitHub API。不会写入插件仓库，也不会回显明文。需要 repo 权限。'
        : 'Stored locally in ~/.dsh/.credentials.yaml for git push and GitHub API. Never committed and never echoed back. Needs repo scope.',
    )
    const status = el('div', 'ghk-status', zh ? '正在读取…' : 'Loading…')
    const input = el('input', 'ghk-input') as HTMLInputElement
    input.type = 'password'
    input.autocomplete = 'off'
    input.spellcheck = false
    input.placeholder = zh ? '粘贴 ghp_… 或 github_pat_…' : 'Paste ghp_… or github_pat_…'
    const actions = el('div', 'ghk-actions')
    const saveBtn = el('button', 'ghk-save') as HTMLButtonElement
    saveBtn.type = 'button'
    saveBtn.textContent = zh ? '保存' : 'Save'
    const clearBtn = el('button', 'ghk-clear') as HTMLButtonElement
    clearBtn.type = 'button'
    clearBtn.textContent = zh ? '清除' : 'Clear'
    const hint = el('div', 'ghk-hint')
    actions.append(saveBtn, clearBtn)
    card.append(title, desc, status, input, actions, hint)
    page.append(card)
    host.append(page)

    const paintStatus = (configured: boolean, source?: string): void => {
      if (configured) {
        const src = source === 'file' ? (zh ? '本机凭据文件' : 'local credentials file') : (source ?? '')
        status.textContent = zh ? `已保存（${src}）` : `Saved (${src})`
        status.dataset.state = 'on'
        input.placeholder = zh ? '已保存。输入新 token 可覆盖' : 'Saved. Paste a new token to replace'
      } else {
        status.textContent = zh ? '尚未保存' : 'Not saved'
        status.dataset.state = 'off'
      }
    }
    const setHint = (text: string, err = false): void => {
      hint.textContent = text
      hint.dataset.err = err ? '1' : ''
    }

    const refresh = async (): Promise<void> => {
      try {
        const res = await fetch(STATUS_URL)
        const payload = await readJson<{ ok?: boolean; configured?: boolean; source?: string; error?: string }>(res)
        if (payload?.ok === true) paintStatus(payload.configured === true, payload.source)
        else {
          status.textContent = payload?.error ?? (zh ? '读取失败' : 'Failed to load')
          status.dataset.state = 'off'
        }
      } catch {
        status.textContent = zh ? '读取失败' : 'Failed to load'
        status.dataset.state = 'off'
      }
    }

    const save = async (token: string | null): Promise<void> => {
      saveBtn.disabled = true
      clearBtn.disabled = true
      setHint(zh ? '正在保存…' : 'Saving…')
      try {
        const res = await fetch(SAVE_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(token === null ? { clear: true } : { token }),
        })
        const payload = await readJson<{ ok?: boolean; configured?: boolean; source?: string; error?: string }>(res)
        if (payload?.ok === true) {
          input.value = ''
          paintStatus(payload.configured === true, payload.source)
          setHint(token === null ? (zh ? '已清除' : 'Cleared') : (zh ? '已保存到本机' : 'Saved on this device'))
        } else {
          setHint(payload?.error ?? (zh ? '保存失败' : 'Save failed'), true)
        }
      } catch {
        setHint(zh ? '保存请求失败' : 'Save request failed', true)
      } finally {
        saveBtn.disabled = false
        clearBtn.disabled = false
      }
    }

    saveBtn.addEventListener('click', () => {
      const token = input.value.trim()
      if (token === '') {
        setHint(zh ? '请先粘贴 token' : 'Paste a token first', true)
        return
      }
      void save(token)
    })
    clearBtn.addEventListener('click', () => {
      void save(null)
    })
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveBtn.click()
    })

    void refresh()
    return () => {
      host.textContent = ''
    }
  }, [])
  return <div ref={hostRef} />
}
