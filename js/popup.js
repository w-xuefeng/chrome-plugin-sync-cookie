import {
  logError,
  logInfo,
  toastAndLog,
  getUrl,
  savaUrl,
  setCookies,
  removeCookies,
  getAllCookies,
  popOnCookieChange,
  receiveMsg,
} from './utils/tools.js'
import {
  createApp,
  reactive,
  toRefs,
  onMounted,
  h,
} from '../lib/vue.esm-browser.js'

const RootComponent = {
  setup() {
    const state = reactive({
      /**
       * 同步 cookie 的 loading
       */
      loading: false,
      /**
       * 开启或关闭监听 cookie 的 loading
       */
      listenLoading: false,
      /**
       * 是否开启监听 cookie 的变化
       */
      hasListen: false,
      /**
       * 本地地址 cookie 要同步的目的地址
       */
      localUrl: getUrl().localUrl || '',
      /**
       * 调试地址 cookie 的源地址
       */
      testUrl: getUrl().testUrl || '',
    })

    /**
     * 地址预处理
     */
    const preUrl = () => {
      chrome.tabs.getSelected(null, (tab) => {
        const { localUrl, testUrl } = getUrl()
        if ((!state.localUrl && localUrl) || tab.url) {
          state.localUrl = localUrl || tab.url
        }
        if (!state.testUrl && testUrl) {
          state.testUrl = testUrl
        }
      })
    }

    /**
     * cookie 同步前的要处理的事情
     * @param {string} localUrl 本地地址 cookie 要同步的目的地址
     * @param {string} testUrl 调试地址 cookie 的源地址
     */
    const prevSync = (localUrl, testUrl) => {
      state.loading = true
      savaUrl(localUrl, testUrl)
      logInfo('开始同步')
    }

    /**
     * cookie 同步后的要处理的事情
     */
    const afterSync = () => {
      state.loading = false
      logInfo('执行结束')
    }

    /**
     * 同步 cookie
     * @param {string} localUrl 本地地址 cookie 要同步的目的地址
     * @param {string} testUrl 调试地址 cookie 的源地址
     */
    const syncCookie = (localUrl, testUrl) => {
      logInfo(`本地地址: ${localUrl}`)
      logInfo(`同步地址: ${testUrl}`)
      return getAllCookies(testUrl)
        .then((cookies) =>
          Promise.all(
            cookies.map((cookie) =>
              removeCookies(localUrl, cookie.name).then((rs) =>
                setCookies(localUrl, cookie, 5 * 60 ** 2)
              )
            )
          )
        )
        .catch((err) => logError(err))
    }

    /**
     * 处理 background 是否开启监听的后续操作
     * @param {boolean} open 是否开启监听 cookie 变化
     */
    const handleListen = (open) => {
      state.listenLoading = false
      state.hasListen =
        open || JSON.parse(localStorage.getItem('hasListen') || false)
      logInfo(
        state.hasListen ? '已开启监听 Cookie 变化' : '未开启监听 Cookie 变化'
      )
    }

    /**
     * 点击同步 cookie 的按钮
     */
    const onSubmit = () => {
      const { localUrl, testUrl, loading } = toRefs(state)
      logInfo('开始执行')

      if (!localUrl.value.trim() || !testUrl.value.trim()) {
        toastAndLog(`地址错误，结束执行`, 'error')
        return
      }

      if (loading.value) {
        toastAndLog(`正在执行中`, 'info')
        return
      }

      prevSync(localUrl.value, testUrl.value)

      syncCookie(localUrl.value, testUrl.value)
        .then((rs) => {
          if (rs) {
            toastAndLog('同步成功', 'success')
          }
          afterSync()
        })
        .catch((e) => {
          toastAndLog('同步异常', 'error')
          afterSync()
        })
    }

    /**
     * 开启或关闭监听 cookie
     * @param {Event} e
     */
    const onSwitch = (e) => {
      const {
        target: { checked },
      } = e
      const { localUrl, testUrl, listenLoading } = toRefs(state)
      logInfo(`开始执行 ${checked ? '开启' : '关闭'}监听 cookie`)

      if (!localUrl.value.trim() || !testUrl.value.trim()) {
        toastAndLog(`地址错误，结束执行`, 'error')
        return
      }
      if (listenLoading.value) {
        toastAndLog(`正在执行中`, 'info')
        return
      }

      state.listenLoading = true

      popOnCookieChange(localUrl.value, testUrl.value, checked)
    }

    /**
     * 与其他页面消息通信后的事件分发
     */
    const msgEvent = {
      background: {
        onCookieListenerChange: (data) => {
          const { open } = data
          handleListen(open)
        },
      },
    }

    /**
     * 初始化页面
     */
    const init = () => {
      preUrl()
      handleListen()
      receiveMsg(msgEvent)
    }

    onMounted(init)

    return {
      state,
      onSubmit,
      onSwitch,
    }
  },
  render({ state, onSwitch, onSubmit }) {
    return [
      h('div', { class: 'line' }, [
        h('label', { for: 'local' }, '本地地址：'),
        h('input', {
          class: 'input',
          type: 'url',
          placeholder: '本地地址',
          value: state.localUrl,
          onInput: (e) => {
            state.localUrl = e.target.value
          },
        }),
      ]),
      h('div', { class: 'line' }, [
        h('label', { for: 'local' }, '调试地址：'),
        h('input', {
          class: 'input',
          type: 'url',
          placeholder: '调试地址',
          value: state.testUrl,
          onInput: (e) => {
            state.testUrl = e.target.value
          },
        }),
      ]),
      h('div', { class: 'op-wrap' }, [
        h('div', { class: 'switch-wrap' }, [
          h('input', {
            type: 'checkbox',
            class: 'switch',
            checked: state.hasListen,
            onChange: onSwitch,
            disabled: state.listenLoading,
          }),
          h(
            'label',
            { for: 'switch', class: 'switch-label' },
            state.listenLoading
              ? '执行中...'
              : state.hasListen
              ? '已开启监听 Cookie 变化'
              : '未开启监听 Cookie 变化'
          ),
        ]),
        h('div', { class: 'button raised blue', onClick: onSubmit }, [
          h(
            'div',
            { class: 'center' },
            state.loading ? '同步中...' : '从调试地址同步 Cookie'
          ),
          h('paper-ripple'),
        ]),
      ]),
    ]
  },
}

createApp(RootComponent).mount('#app')
