let loading = false

const submit = () => {
  logInfo('开始执行')
  const localUrl = $('#local').val()
  const testUrl = $('#test').val()

  if (!localUrl.trim() || !testUrl.trim()) {
    toastAndLog(`地址错误，结束执行`, 'error')
    return
  }

  if (loading) {
    toastAndLog(`正在执行中`, 'info')
    return
  }

  prevSync(localUrl, testUrl)

  syncCookie(localUrl, testUrl)
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

const prevSync = (localUrl, testUrl) => {
  loading = true
  $('.button').text('同步中...')
  savaUrl(localUrl, testUrl)
  logInfo('开始同步')
}

const afterSync = () => {
  $('.button').text('从调试地址同步 Cookie')
  loading = false
  logInfo('执行结束')
}

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

const bindButton = () => $('.button').on('click', submit)

const start = () => {
  preUrl()
  bindButton()
}

$(start)
