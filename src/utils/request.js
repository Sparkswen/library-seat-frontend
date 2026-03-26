import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.studentNo) {
      config.headers['X-Student-No'] = user.studentNo
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

export default request
