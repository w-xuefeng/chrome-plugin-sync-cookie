const ERROR_COLOR = `color:red`
const INFO_COLOR = `color:deepskyblue`
const SUCCESS_COLOR = `color:rgb(0,202,75)`

const logError = (content) =>
  console.log(`%c[sync-cookie tips]: ${content}`, ERROR_COLOR)

const logInfo = (content) =>
  console.log(`%c[sync-cookie tips]: ${content}`, INFO_COLOR)

const logSuccess = (content) =>
  console.log(`%c[sync-cookie tips]: ${content}`, SUCCESS_COLOR)

const MSG_EVENT = {
  popup: {
    onCookieChange: (data) => {
      const { open, local, domain } = data
      const handleChange = (changeInfo) => {
        if (domain === changeInfo.cookie.domain) {
          listenCookie(changeInfo, { local, domain })
        }
      }

      open && !chrome.cookies.onChanged.hasListener(handleChange)
        ? (chrome.cookies.onChanged.addListener(handleChange),
          logSuccess('监听已开启'))
        : (chrome.cookies.onChanged.removeListener(handleChange),
          logInfo('监听已关闭'))

      localStorage.setItem('hasListen', !!open)
      sendMsgToPopup('onCookieListenerChange', { open })
    },
  },
}

const receiveMsg = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { _dataFrom, _dataType, data } = message
    MSG_EVENT &&
      MSG_EVENT[_dataFrom] &&
      MSG_EVENT[_dataFrom][_dataType] &&
      typeof MSG_EVENT[_dataFrom][_dataType] === 'function' &&
      MSG_EVENT[_dataFrom][_dataType](data)
  })
}

const listenCookie = (info, data) => {
  const { cause, cookie, removed } = info
  const { local, domain } = data
  if (removed) {
    logError(`${cause} ${JSON.stringify(cookie, null, 2)}`)
    Cookie.removeCookies(local, cookie.name)
  } else {
    logInfo(`${cause} ${JSON.stringify(cookie, null, 2)}`)
    Cookie.setCookies(domain, cookie)
  }
}

class Cookie {
  static removeCookies = (url, key) =>
    new Promise((resolve) => {
      chrome.cookies.remove(
        {
          url: url,
          name: key,
        },
        (cookies) => {
          resolve(cookies)
          logError(`删除旧 cookie：${key}`)
        }
      )
    })

  static setCookies = (domain, cookie, expireSecond) => {
    const param = {
      url: `https://${domain}`,
      name: cookie.name,
      value: cookie.value,
      path: '/',
      secure: false,
      httpOnly: false,
      domain,
    }
    if (!!expireSecond) {
      param.expirationDate = new Date().getTime() / 1000 + expireSecond
    }
    return new Promise((resolve) => {
      try {
        chrome.cookies.set(param, (rs) => {
          logInfo(`设置 cookies ${param.name}`)
          resolve(rs)
        })
      } catch (error) {
        logError(`同步出错 ${error}`)
      }
    })
  }
}

const sendMsgToPopup = (_dataType, data) => {
  chrome.extension.sendMessage({ data, _dataType, _dataFrom: 'background' })
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('欢迎使用 sync-cookie')
})

receiveMsg()
