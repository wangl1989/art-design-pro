import request from '@/utils/http'
import { BaseResult } from '@/types/axios'
import { CaptchaData, LoginParams, TokenResponse } from './model/loginModel'
import { UserDetailResponse } from './model/userModel' // 确保导入 UserDetailResponse

export class UserService {
  // 登录 - 接收 body 和 header 值
  static login(body: LoginParams, key: string, deviceId: string) {
    // 构建 headers
    const headers = {
      'Captcha-Key': key,
      'Device-Id': deviceId
    }

    // 发送登录请求
    return request.post<BaseResult<TokenResponse>>({
      url: '/login',
      params: body,
      headers
    })
  }

  // 获取验证码
  static getCaptcha() {
    return request.get<BaseResult<CaptchaData>>({
      url: '/genCaptcha',
      // 添加时间戳防止缓存
      params: { t: new Date().getTime() },
      // 显式设置不发送凭证
      withCredentials: false
    })
  }

  // 刷新 Token
  static refreshToken(refreshToken: string) {
    if (!refreshToken) {
      return Promise.reject(new Error('Refresh token is required'))
    }

    const deviceId = localStorage.getItem('deviceId') || ''
    const headers = {
      'Device-Id': deviceId
    }

    return request.post<BaseResult<TokenResponse>>({
      url: '/api/auth/refresh',
      params: { refreshToken },
      headers
    })
  }

  // 获取当前用户详情 - 简化后的方法，不再处理 token 刷新逻辑
  static getCurrentUser() {
    // 不需要任何额外参数，认证头和刷新逻辑将由 HTTP 拦截器自动处理
    return request.get<BaseResult<UserDetailResponse>>({
      url: '/api/admin/user/currentUser'
    })
  }
}
