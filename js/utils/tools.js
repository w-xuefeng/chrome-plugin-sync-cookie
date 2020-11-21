const ERROR_COLOR = `color:red`
const INFO_COLOR = `color:deepskyblue`
const SUCCESS_COLOR = `color:rgb(0,202,75)`

export const logError = (content) =>
  console.log(`%c[sync-cookie tips]: ${content}`, ERROR_COLOR)

export const logInfo = (content) =>
  console.log(`%c[sync-cookie tips]: ${content}`, INFO_COLOR)

export const logSuccess = (content) =>
  console.log(`%c[sync-cookie tips]: ${content}`, SUCCESS_COLOR)

export const toast = ({ msg, duration = 3000, location = 'bottom' }) => {
  const vlocation =
    location === 'bottom'
      ? 'bottom: 10%;'
      : location === 'top'
      ? 'top: 10%;'
      : 'top: 50%;'
  const toastElement = document.createElement('div')
  toastElement.innerHTML = msg
  toastElement.style.cssText = `
     ${vlocation};
      max-width:60%;
      min-width:150px;
      padding:0 14px;
      height: 40px;
      color: rgb(255, 255, 255);
      line-height: 40px;
      text-align: center;
      border-radius: 4px;
      position: fixed;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      background: rgba(0, 0, 0, 0.75);
      font-size: 16px;
    `
  document.body.appendChild(toastElement)
  setTimeout(() => {
    const delay = 0.5
    toastElement.style.transition = `transform ${delay}s ease-in, opacity ${delay}s ease-in`
    toastElement.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(toastElement)
    }, delay * 1000)
  }, duration)
}

export const toastAndLog = (content, logType = 'info', toastOpt) => {
  switch (logType) {
    case 'info':
      logInfo(content)
      break
    case 'error':
      logError(content)
      break
    case 'success':
      logSuccess(content)
      break
    default:
      logInfo(content)
      break
  }
  toast({ ...toastOpt, msg: content })
}

export const getDomain = (url) => {
  const a = document.createElement('a')
  a.href = url
  return a.hostname
}

export const getUrl = () => {
  const localUrl = localStorage.getItem('localUrl') || null
  const testUrl = localStorage.getItem('testUrl') || null
  return { localUrl, testUrl }
}

export const savaUrl = (localUrl, testUrl) => {
  localStorage.setItem('localUrl', localUrl)
  localStorage.setItem('testUrl', testUrl)
}

export const setCookies = (url, cookie, expireSecond) => {
  const domain = getDomain(url)
  const param = {
    url: `https://${domain}`,
    name: cookie.name,
    value: cookie.value,
    path: '/',
    secure: false, // cookie.secure,
    httpOnly: false, // cookie.httpOnly,
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

export const getAllCookies = (url) =>
  new Promise((resolve, reject) => {
    chrome.cookies.getAll({ url }, (cookies) => {
      if (cookies) {
        resolve(cookies)
        cookies.forEach((e) => logSuccess(`获得 cookies: ${e.name}`))
      }
      reject(cookies)
    })
  })

export const getCookies = (url, key) =>
  new Promise((resolve, reject) => {
    chrome.cookies.get(
      {
        url: url,
        name: key,
      },
      (cookies) => {
        if (cookies && cookies.value) {
          resolve(cookies)
        }
        reject(cookies)
      }
    )
  })

export const removeCookies = (url, key) =>
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

export const sendMsgToBackground = (_dataType, data) => {
  chrome.runtime.sendMessage({ data, _dataType, _dataFrom: 'popup' })
}

export const receiveMsg = (msgEvent) => {
  chrome.extension.onMessage.addListener((message, sender, sendResponse) => {
    const { _dataFrom, _dataType, data } = message
    msgEvent &&
      msgEvent[_dataFrom] &&
      msgEvent[_dataFrom][_dataType] &&
      typeof msgEvent[_dataFrom][_dataType] === 'function' &&
      msgEvent[_dataFrom][_dataType](data)
  })
}

export const popOnCookieChange = (local, url, open) => {
  const domain = getDomain(url)
  sendMsgToBackground('onCookieChange', { local, domain, open })
}
